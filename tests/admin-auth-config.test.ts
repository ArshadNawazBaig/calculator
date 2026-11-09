import {afterEach, describe, expect, it, vi} from 'vitest';
import {Client, type Pool} from 'pg';
import {databasePoolOptions, isDatabaseConfigured} from '@/lib/server/db';
import {consumeAccountLoginAttempt, createAuthCore, getAdminTrustedOrigins, readAdminConfiguration} from '@/lib/server/auth-core';

vi.mock('better-auth', () => ({betterAuth: (options: unknown) => ({options})}));
afterEach(() => vi.unstubAllEnvs());
const secret = 'test-only-secret-that-is-at-least-32-characters';

describe('admin configuration boundaries', () => {
  it('has no implicit URL or secret fallback', () => {
    expect(readAdminConfiguration({})).toBeNull();
    expect(readAdminConfiguration({BETTER_AUTH_URL: 'https://finflo.org', BETTER_AUTH_SECRET: 'short'})).toBeNull();
    vi.stubEnv('DATABASE_URL', '');
    expect(isDatabaseConfigured()).toBe(false);
  });
  it.each(['https://finflo.org', 'http://localhost:3100', 'http://127.0.0.1:3100', 'http://[::1]:3100'])('accepts an explicit safe origin %s', origin => {
    expect(readAdminConfiguration({BETTER_AUTH_URL: origin, BETTER_AUTH_SECRET: secret})).toMatchObject({origin, secureCookies: origin.startsWith('https:')});
  });
  it.each(['http://finflo.org', 'https://user:password@finflo.org', 'https://finflo.org/admin', 'https://finflo.org?preview=1', 'https://finflo.org#fragment', 'http://localhost.example:3100', 'http://127.1:3100', 'https://finflo.org\n'])('rejects unsafe or inferred origins %j', origin => {
    expect(readAdminConfiguration({BETTER_AUTH_URL: origin, BETTER_AUTH_SECRET: secret})).toBeNull();
  });
  it.each([
    'http://localhost:3100', 'http://127.0.0.1:3100', 'http://[::1]:3100',
    'https://localhost:3100', 'https://127.0.0.1:3100', 'https://[::1]:3100',
  ])('permits only explicit same-scheme, same-port loopback aliases for %s', origin => {
    const config = readAdminConfiguration({BETTER_AUTH_URL: origin, BETTER_AUTH_SECRET: secret})!;
    const {protocol, port} = new URL(origin);
    const expected = ['localhost', '127.0.0.1', '[::1]'].map(host => `${protocol}//${host}:${port}`);
    const trusted = getAdminTrustedOrigins(config);
    expect(new Set(trusted)).toEqual(new Set(expected));
    expect(trusted).toHaveLength(3);
    expect(createAuthCore({} as Pool, config).options.trustedOrigins).toEqual(trusted);
    for (const foreign of [
      `${protocol}//localhost:3101`,
      `${protocol === 'http:' ? 'https:' : 'http:'}//localhost:3100`,
      `${protocol}//localhost.evil.example:3100`,
      `${protocol}//127.0.0.2:3100`,
      `${protocol}//[::2]:3100`,
      'https://finflo.org',
    ]) expect(trusted).not.toContain(foreign);
    expect(trusted.some(value => value.includes('*'))).toBe(false);
  });
  it.each(['https://finflo.org', 'https://www.finflo.org:444'])('keeps a public deployment restricted to its exact origin %s', origin => {
    const config = readAdminConfiguration({BETTER_AUTH_URL: origin, BETTER_AUTH_SECRET: secret})!;
    expect(getAdminTrustedOrigins(config)).toEqual([origin]);
    expect(createAuthCore({} as Pool, config).options.trustedOrigins).toEqual([origin]);
  });
  it('disables web signup and cookie caching while isolating all auth models', () => {
    const auth = createAuthCore({} as Pool, {secret, origin: 'https://finflo.org', secureCookies: true});
    expect(auth.options.emailAndPassword?.disableSignUp).toBe(true);
    expect(auth.options.user?.additionalFields?.role).toMatchObject({defaultValue: 'reader', input: false});
    expect(auth.options.session?.cookieCache?.enabled).toBe(false);
    expect([auth.options.user?.modelName, auth.options.session?.modelName, auth.options.account?.modelName, auth.options.verification?.modelName, auth.options.rateLimit?.modelName]).toEqual(['blog_user', 'blog_session', 'blog_account', 'blog_verification', 'blog_rate_limit']);
    expect(auth.options.rateLimit).toMatchObject({enabled: true, storage: 'database'});
    expect(auth.options.trustedOrigins).toEqual(['https://finflo.org']);
    expect(auth.options.advanced?.defaultCookieAttributes).toMatchObject({httpOnly: true, sameSite: 'lax', secure: true});
  });
});

describe('PostgreSQL TLS policy', () => {
  it('permits explicit loopback Postgres for local integration', () => {
    expect(databasePoolOptions('postgresql://tester@127.0.0.1:55432/finflo?sslmode=disable').ssl).toBe(false);
  });
  it('keeps certificate verification enabled despite connection-string SSL overrides', () => {
    const options = databasePoolOptions('postgresql://tester:fictional@db.example/finflo?sslmode=require&uselibpqcompat=true&ssl=0&sslrootcert=/tmp/untrusted&channel_binding=require');
    const client = new Client(options) as unknown as {connectionParameters: {ssl: unknown}};
    expect(client.connectionParameters.ssl).toEqual({rejectUnauthorized: true});
    expect(options.connectionString).not.toMatch(/sslmode|sslrootcert|uselibpqcompat|ssl=/);
    expect(options.connectionString).toContain('channel_binding=require');
  });
  it.each(['postgresql://tester@db.example/finflo?sslmode=disable', 'postgresql://tester@localhost/finflo?host=db.example', 'https://db.example/finflo', 'not-a-connection-url'])('rejects unsafe connection configuration', value => {
    expect(() => databasePoolOptions(value)).toThrow();
  });
});

describe('persistent account-attempt throttle', () => {
  it('normalizes and HMACs the account key, keeping email out of SQL and parameters', async () => {
    const query = vi.fn().mockResolvedValue({rows: [{attempts: 1}]});
    const db = {query} as unknown as Pick<Pool, 'query'>;
    await consumeAccountLoginAttempt(db, '  Fictional@Example.com ', secret);
    await consumeAccountLoginAttempt(db, 'fictional@example.com', secret);
    const [sql, params] = query.mock.calls[0];
    expect(params[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(params[0]).toBe(query.mock.calls[1][1][0]);
    expect(sql).toContain('ON CONFLICT');
    expect(sql).not.toContain('Fictional');
    expect(JSON.stringify(params)).not.toContain('example.com');
  });
  it('denies an attempt after the persistent account limit', async () => {
    const query = vi.fn().mockResolvedValue({rows: [{attempts: 11}]});
    expect(await consumeAccountLoginAttempt({query} as unknown as Pick<Pool, 'query'>, 'fictional@example.com', secret)).toBe(false);
  });
});
