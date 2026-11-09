import {createHmac, randomUUID} from 'node:crypto';
import {betterAuth} from 'better-auth';
import {APIError, createAuthMiddleware} from 'better-auth/api';
import {hashPassword} from 'better-auth/crypto';
import type {Pool} from 'pg';
import {z} from 'zod';

export class AuthError extends Error {
  constructor(message: string, public readonly status: 401 | 403 | 429 | 503 = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export type AdminConfiguration = {secret: string; origin: string; secureCookies: boolean};
export type SuperAdminSession = {
  user: {id: string; email: string; name: string; role: 'super_admin'};
  session: {id: string; expiresAt: Date};
};

/** An explicit origin prevents request/forwarded-header inference. */
export function readAdminConfiguration(env: Record<string, string | undefined> = process.env): AdminConfiguration | null {
  const secret = env.BETTER_AUTH_SECRET;
  const value = env.BETTER_AUTH_URL;
  if (!secret || secret.length < 32 || !value || value !== value.trim()) return null;
  try {
    const url = new URL(value);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) return null;
    // Accept only an origin (with an optional conventional trailing slash).
    if (value !== url.origin && value !== url.origin + '/') return null;
    return {secret, origin: url.origin, secureCookies: url.protocol === 'https:'};
  } catch {return null;}
}

export const loginWindowSeconds = 15 * 60;
export const maxAccountLoginAttempts = 10;

/** Atomic account counter persists across processes without storing raw emails. */
export async function consumeAccountLoginAttempt(db: Pick<Pool, 'query'>, email: string, secret: string, at = new Date()): Promise<boolean> {
  const key = createHmac('sha256', secret).update(email.trim().toLowerCase()).digest('hex');
  const result = await db.query<{attempts: number}>(`
    INSERT INTO blog_login_throttle (account_key, attempts, window_start)
    VALUES ($1, 1, $2)
    ON CONFLICT (account_key) DO UPDATE SET
      attempts = CASE WHEN blog_login_throttle.window_start <= $2::timestamptz - interval '15 minutes'
        THEN 1 ELSE blog_login_throttle.attempts + 1 END,
      window_start = CASE WHEN blog_login_throttle.window_start <= $2::timestamptz - interval '15 minutes'
        THEN $2 ELSE blog_login_throttle.window_start END
    RETURNING attempts`, [key, at]);
  return result.rows[0].attempts <= maxAccountLoginAttempts;
}

export function createAuthCore(db: Pool, config: AdminConfiguration) {
  return betterAuth({
    appName: 'Finflo Admin',
    baseURL: config.origin,
    basePath: '/api/auth',
    secret: config.secret,
    database: db,
    trustedOrigins: [config.origin],
    emailAndPassword: {enabled: true, disableSignUp: true, minPasswordLength: 16, maxPasswordLength: 128},
    user: {
      modelName: 'blog_user',
      additionalFields: {role: {type: 'string', required: true, defaultValue: 'reader', input: false}},
      changeEmail: {enabled: false},
      deleteUser: {enabled: false},
    },
    session: {
      modelName: 'blog_session',
      expiresIn: 60 * 60 * 8,
      cookieCache: {enabled: false},
      disableSessionRefresh: true,
    },
    account: {modelName: 'blog_account'},
    verification: {modelName: 'blog_verification'},
    rateLimit: {
      enabled: true,
      storage: 'database',
      modelName: 'blog_rate_limit',
      window: 60,
      max: 100,
      customRules: {'/sign-in/email': {window: 60, max: 10}},
    },
    advanced: {
      cookiePrefix: 'finflo-admin',
      useSecureCookies: config.secureCookies,
      defaultCookieAttributes: {httpOnly: true, sameSite: 'lax', secure: config.secureCookies, path: '/'},
      // Without a verified hosting-header contract, untrusted forwarded addresses
      // must not let callers bypass limits. The library uses a shared path bucket;
      // the independent account counter above additionally limits distributed attempts.
      ipAddress: {ipAddressHeaders: []},
    },
    hooks: {
      before: createAuthMiddleware(async context => {
        if (context.path !== '/sign-in/email') return;
        const email = context.body?.email;
        if (typeof email !== 'string' || email.length > 320) return;
        if (!await consumeAccountLoginAttempt(db, email, config.secret)) throw new APIError('TOO_MANY_REQUESTS', {message: 'Sign-in is temporarily unavailable. Try again later.'});
      }),
    },
    logger: {disabled: true},
  });
}

const bootstrapInput = z.object({
  email: z.email().max(254).transform(value => value.trim().toLowerCase()),
  name: z.string().trim().min(1).max(100),
  password: z.string().min(16).max(128),
});

/** CLI-only bootstrap. No web endpoint imports or exposes this operation. */
export async function createBootstrapSuperAdmin(db: Pool, input: {email: string; name: string; password: string}): Promise<{id: string}> {
  const parsed = bootstrapInput.safeParse(input);
  if (!parsed.success) throw new Error('Provide a valid email, a name, and a password of 16–128 characters.');
  const values = parsed.data;
  // The official Better Auth password format is required by its credential login.
  const passwordHash = await hashPassword(values.password);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(746561031)');
    const existing = await client.query('SELECT id FROM blog_user WHERE role = $1 OR lower(email) = $2 LIMIT 1', ['super_admin', values.email]);
    if (existing.rowCount) throw new Error('Bootstrap refused: an administrator or the requested account already exists. No account was changed.');
    const id = randomUUID(), accountId = randomUUID();
    await client.query('INSERT INTO blog_user (id, name, email, "emailVerified", role, "createdAt", "updatedAt") VALUES ($1, $2, $3, false, $4, now(), now())', [id, values.name, values.email, 'reader']);
    await client.query('INSERT INTO blog_account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") VALUES ($1, $2, $3, $2, $4, now(), now())', [accountId, id, 'credential', passwordHash]);
    await client.query('UPDATE blog_user SET role = $1, "updatedAt" = now() WHERE id = $2', ['super_admin', id]);
    await client.query('COMMIT');
    return {id};
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}

/** Trusted CLI recovery only; replaces one credential and revokes all its sessions. */
export async function resetBootstrapSuperAdminPassword(db: Pool, input: {email: string; password: string}): Promise<void> {
  const parsed = bootstrapInput.pick({email: true, password: true}).safeParse(input);
  if (!parsed.success) throw new Error('Provide a valid email and a password of 16–128 characters.');
  const passwordHash = await hashPassword(parsed.data.password);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(746561031)');
    const user = await client.query<{id: string}>('SELECT id FROM blog_user WHERE lower(email) = $1 AND role = $2 FOR UPDATE', [parsed.data.email, 'super_admin']);
    if (user.rowCount !== 1) throw new Error('Password recovery refused: the exact super admin account was not found.');
    const updated = await client.query('UPDATE blog_account SET password = $1, "updatedAt" = now() WHERE "userId" = $2 AND "providerId" = $3 RETURNING id', [passwordHash, user.rows[0].id, 'credential']);
    if (updated.rowCount !== 1) throw new Error('Password recovery refused: the account does not have exactly one password credential.');
    await client.query('DELETE FROM blog_session WHERE "userId" = $1', [user.rows[0].id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}
