import {createInterface} from 'node:readline/promises';
import {stdin, stdout} from 'node:process';
import {getDb} from '../src/lib/server/db';
import {readAdminConfiguration, resetBootstrapSuperAdminPassword} from '../src/lib/server/auth-core';
import {hiddenPassword} from './admin-password-input';

async function main() {
  if (process.argv.slice(2).length) throw new Error('This command accepts no arguments. Provide the exact SUPER_ADMIN_EMAIL privately; the new password is requested without echo or read from private SUPER_ADMIN_PASSWORD.');
  if (!readAdminConfiguration()) throw new Error('Configure BETTER_AUTH_URL and a high-entropy BETTER_AUTH_SECRET of at least 32 characters before recovery.');
  let email = process.env.SUPER_ADMIN_EMAIL?.trim();
  if (!email) {
    if (!stdin.isTTY) throw new Error('Configure SUPER_ADMIN_EMAIL.');
    const prompts = createInterface({input: stdin, output: stdout});
    try {email = (await prompts.question('Existing super admin email: ')).trim();} finally {prompts.close();}
  }
  let password = process.env.SUPER_ADMIN_PASSWORD;
  delete process.env.SUPER_ADMIN_PASSWORD;
  if (password === undefined) {
    password = await hiddenPassword('New admin password (16–128 characters): ');
    if (password !== await hiddenPassword('Repeat new password: ')) throw new Error('Passwords did not match. No credential was changed.');
  }
  const db = getDb();
  try {
    await resetBootstrapSuperAdminPassword(db, {email: email!, password});
    console.log('Super admin password replaced and existing sessions revoked. Sign in again.');
  } finally {password = ''; await db.end();}
}

main().catch(error => {
  const message = error instanceof Error && /^(This command|Use an interactive|Bootstrap cancelled|Provide a valid|Configure |Passwords did not match|Password recovery refused)/.test(error.message) ? error.message : 'Password recovery failed. Check private configuration, database access and applied migrations. No credentials were printed.';
  console.error(message);
  process.exitCode = 1;
});
