import {createInterface} from 'node:readline/promises';
import {stdin, stdout} from 'node:process';
import {hiddenPassword} from './admin-password-input';
import {getDb} from '../src/lib/server/db';
import {createBootstrapSuperAdmin, readAdminConfiguration} from '../src/lib/server/auth-core';


async function main() {
  if (process.argv.slice(2).length) throw new Error('This command accepts no arguments. Configure SUPER_ADMIN_EMAIL and optional SUPER_ADMIN_NAME privately; the password is requested without echo or read from private SUPER_ADMIN_PASSWORD.');
  if (!readAdminConfiguration()) throw new Error('Configure BETTER_AUTH_URL and a high-entropy BETTER_AUTH_SECRET of at least 32 characters before bootstrap.');
  const prompts = createInterface({input: stdin, output: stdout});
  let email = process.env.SUPER_ADMIN_EMAIL?.trim();
  let name = process.env.SUPER_ADMIN_NAME?.trim();
  try {
    if (!email) {if (!stdin.isTTY) throw new Error('Configure SUPER_ADMIN_EMAIL.'); email = (await prompts.question('Admin email: ')).trim();}
    if (!name) name = stdin.isTTY ? (await prompts.question('Admin display name: ')).trim() : 'Finflo administrator';
  } finally {prompts.close();}
  let password = process.env.SUPER_ADMIN_PASSWORD;
  delete process.env.SUPER_ADMIN_PASSWORD;
  if (password === undefined) {
    password = await hiddenPassword('Admin password (16–128 characters): ');
    const confirmation = await hiddenPassword('Repeat password: ');
    if (password !== confirmation) throw new Error('Passwords did not match. No account was created.');
  }
  const db = getDb();
  try {
    await createBootstrapSuperAdmin(db, {email: email!, name: name || 'Finflo administrator', password});
    console.log('Super admin created. Sign in using the configured admin page.');
  } finally {password = ''; await db.end();}
}

main().catch(error => {
  const message = error instanceof Error && /^(This command|Use an interactive|Bootstrap |Provide a valid|Configure |Passwords did not match)/.test(error.message) ? error.message : 'Admin bootstrap failed. Check private configuration, database access and applied migrations. No credentials were printed.';
  console.error(message);
  process.exitCode = 1;
});
