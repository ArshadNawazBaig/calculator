import {Pool, type PoolConfig} from 'pg';

const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** Keep certificate verification enabled for Neon and other remote databases. */
export function databasePoolOptions(connectionString: string): PoolConfig {
  let url: URL;
  try {url = new URL(connectionString);} catch {throw new Error('DATABASE_URL must be a PostgreSQL connection URL.');}
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) throw new Error('DATABASE_URL must identify a PostgreSQL host and database.');
  const local = loopbackHosts.has(url.hostname);
  const sslMode = url.searchParams.get('sslmode');
  if (!local && sslMode === 'disable') throw new Error('Remote database connections require verified TLS.');
  if (['host', 'hostaddr', 'port', 'user', 'password', 'database', 'dbname'].some(key => url.searchParams.has(key))) throw new Error('Use the PostgreSQL URL authority and path for connection details.');
  // pg connection-string SSL parameters override an explicit ssl object. Strip
  // them before supplying our verification policy; never use rejectUnauthorized:false.
  for (const key of [...url.searchParams.keys()]) if (key.startsWith('ssl') || key === 'uselibpqcompat') url.searchParams.delete(key);
  return {
    connectionString: url.href,
    ssl: local && (!sslMode || sslMode === 'disable') ? false : {rejectUnauthorized: true},
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
    application_name: 'finflo-blog',
  };
}

let pool: Pool | undefined;

/** Creating/importing this module never opens a database connection. */
export function getDb(): Pool {
  if (!isDatabaseConfigured()) throw new Error('Database is not configured.');
  if (!pool) {
    pool = new Pool(databasePoolOptions(process.env.DATABASE_URL!.trim()));
    // Individual operations report failures to their callers. An idle-client
    // disconnect must not crash the app or print connection credentials.
    pool.on('error', () => {});
  }
  return pool;
}
