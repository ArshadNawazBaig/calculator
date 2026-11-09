import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const state = vi.hoisted(() => ({configured: true, getSession: vi.fn(), incoming: new Headers()}));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({headers: async () => state.incoming}));
vi.mock('@/lib/server/db', () => ({isDatabaseConfigured: () => state.configured, getDb: () => ({})}));
vi.mock('@/lib/server/auth-core', async importOriginal => {
  const original = await importOriginal<typeof import('@/lib/server/auth-core')>();
  return {...original, createAuthCore: () => ({api: {getSession: state.getSession}})};
});
import {AuthError, getSuperAdminSession, requireSuperAdmin} from '@/lib/server/auth';

beforeEach(() => {
  state.configured = true;
  state.getSession.mockReset();
  state.incoming = new Headers({cookie: 'fictional-session-cookie'});
  vi.stubEnv('BETTER_AUTH_URL', 'https://finflo.org');
  vi.stubEnv('BETTER_AUTH_SECRET', 'test-only-secret-that-is-at-least-32-characters');
});
afterEach(() => vi.unstubAllEnvs());
const session = (role: string) => ({user: {id: 'u1', name: 'Test operator', email: 'test@example.com', role}, session: {id: 's1', token: 'private-session-token', expiresAt: new Date('2030-01-01')}});

describe('authoritative admin authorization', () => {
  it('does not authorize a session-cookie presence without a server-side session', async () => {
    state.getSession.mockResolvedValue(null);
    await expect(requireSuperAdmin()).rejects.toMatchObject({status: 401});
    expect(state.getSession).toHaveBeenCalledWith({headers: state.incoming, query: {disableCookieCache: true, disableRefresh: true}});
  });
  it.each(['reader', 'admin', 'SUPER_ADMIN', ''])('requires the exact super_admin role rather than %j', async role => {
    state.getSession.mockResolvedValue(session(role));
    await expect(requireSuperAdmin()).rejects.toMatchObject({status: 403});
    expect(await getSuperAdminSession()).toBeNull();
  });
  it('rechecks each privileged call so revocation or role changes take effect', async () => {
    state.getSession.mockResolvedValueOnce(session('super_admin')).mockResolvedValueOnce(null);
    const current = await requireSuperAdmin();
    expect(current.user.role).toBe('super_admin');
    expect(current.session).not.toHaveProperty('token');
    await expect(requireSuperAdmin()).rejects.toMatchObject({status: 401});
    expect(state.getSession).toHaveBeenCalledTimes(2);
  });
  it('fails closed without configured auth or when database validation fails', async () => {
    state.configured = false;
    expect(await getSuperAdminSession()).toBeNull();
    await expect(requireSuperAdmin()).rejects.toBeInstanceOf(AuthError);
    await expect(requireSuperAdmin()).rejects.toMatchObject({status: 503});
    state.configured = true;
    state.getSession.mockRejectedValue(new Error('private-db-credential-must-not-escape'));
    await expect(requireSuperAdmin()).rejects.toMatchObject({status: 503, message: 'Admin authentication is temporarily unavailable.'});
  });
});
