import {createHash} from 'node:crypto';
import {readdir, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {getDb} from '../src/lib/server/db.ts';

const directory = new URL('../migrations/', import.meta.url);
let db, client;
try {
  const files = (await readdir(directory)).filter(name => /^\d{4}_[a-z0-9_-]+\.sql$/.test(name)).sort();
  if (!files.length) throw new Error('Migration files are missing.');
  if (new Set(files.map(name => name.slice(0, 4))).size !== files.length) throw new Error('Migration numbering must be unique.');
  const migrations = await Promise.all(files.map(async name => {
    const sql = await readFile(fileURLToPath(new URL(name, directory)), 'utf8');
    return {name, sql, checksum: createHash('sha256').update(sql).digest('hex')};
  }));
  const source = new Map(migrations.map(migration => [migration.name, migration]));
  db = getDb();
  client = await db.connect();
  for (const [index, migration] of migrations.entries()) {
    await client.query('BEGIN');
    try {
      // Transaction-scoped locks also work with Neon's transaction pooler.
      // Re-read the ledger under this lock: another runner may have just applied
      // a file after our previous transaction released its connection.
      await client.query('SELECT pg_advisory_xact_lock(746561030)');
      await client.query('CREATE TABLE IF NOT EXISTS blog_schema_migration (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
      const recorded = await client.query('SELECT name, checksum FROM blog_schema_migration ORDER BY name');
      for (const [position, row] of recorded.rows.entries()) {
        const expected = source.get(row.name);
        if (!expected) throw new Error('Previously applied migration is missing from this release.');
        if (row.checksum !== expected.checksum) throw new Error(`Applied migration checksum changed: ${expected.name}`);
        if (files[position] !== row.name) throw new Error('Migration history order changed. Add new migrations after the applied sequence.');
      }
      if (recorded.rows.some(row => row.name === migration.name)) {
        await client.query('COMMIT');
        console.log(`Already applied: ${migration.name}`);
        continue;
      }
      if (recorded.rows.length !== index) throw new Error('Migration history order changed. Earlier files must be applied first.');
      await client.query(migration.sql);
      await client.query('INSERT INTO blog_schema_migration (name, checksum) VALUES ($1, $2)', [migration.name, migration.checksum]);
      await client.query('COMMIT');
      console.log(`Applied: ${migration.name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof Error && /^(Previously applied migration|Applied migration checksum|Migration history order)/.test(error.message)) throw error;
      throw new Error(`Migration failed and was rolled back: ${migration.name}`);
    }
  }
} catch (error) {
  // Only our own migration errors are printable; provider errors can include
  // connection identifiers or service configuration.
  const message = error instanceof Error && /^(Migration files|Migration numbering|Previously applied migration|Applied migration checksum|Migration history order|Migration failed)/.test(error.message) ? error.message : 'Database migration could not run. Check private database configuration and access.';
  console.error(message);
  process.exitCode = 1;
} finally {
  client?.release();
  await db?.end();
}
