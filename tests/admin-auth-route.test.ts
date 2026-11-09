import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
const state = vi.hoisted(() => ({configured: true, handler: vi.fn()}));
vi.mock('@/lib/server/auth', () => ({isAdminConfigured: () => state.configured, getAuth: () => ({handler: state.handler})}));
import {GET, POST} from '@/app/api/auth/[...all]/route';
const origin = 'https://finflo.org';
const post = (path: string, body = '{}', requestOrigin: string | null = origin, requestUrlOrigin = origin) => new Request(requestUrlOrigin + '/api/auth/' + path, {method: 'POST', headers: {'content-type': 'application/json', ...(requestOrigin ? {origin: requestOrigin} : {})}, body});
beforeEach(() => {
  state.configured = true;
  state.handler.mockReset().mockResolvedValue(Response.json({ok: true}));
  vi.stubEnv('BETTER_AUTH_URL', origin);
  vi.stubEnv('BETTER_AUTH_SECRET', 'test-only-secret-that-is-at-least-32-characters');
});
afterEach(() => vi.unstubAllEnvs());

describe('closed admin authentication HTTP surface', () => {
  it.each(['sign-up/email', 'reset-password', 'update-user', 'delete-user', 'admin/create-user', 'list-sessions'])('does not expose %s', async path => {
    expect((await POST(post(path))).status).toBe(404);
    expect(state.handler).not.toHaveBeenCalled();
  });
  it.each([
    null, 'https://other.example', 'https://finflo.org.evil.example',
    'http://localhost:3100', 'http://127.0.0.1:3100', 'http://[::1]:3100',
    'https://localhost', 'https://127.0.0.1', 'https://[::1]',
  ])('rejects missing or foreign origins on a public deployment before auth processing: %s', async value => {
    expect((await POST(post('sign-in/email', '{}', value))).status).toBe(403);
    expect(state.handler).not.toHaveBeenCalled();
  });
  it.each([
    'http://localhost:3100', 'http://127.0.0.1:3100', 'http://[::1]:3100',
    'https://localhost:3100', 'https://127.0.0.1:3100', 'https://[::1]:3100',
  ])('allows local sign-in and sign-out through each same-port loopback alias when configured as %s', async configuredOrigin => {
    vi.stubEnv('BETTER_AUTH_URL', configuredOrigin);
    const {protocol} = new URL(configuredOrigin);
    for (const host of ['localhost', '127.0.0.1', '[::1]']) {
      const requestOrigin = `${protocol}//${host}:3100`;
      for (const path of ['sign-in/email', 'sign-out']) {
        const response = await POST(post(path, '{}', requestOrigin, requestOrigin));
        expect(response.status).toBe(200);
      }
    }
    expect(state.handler).toHaveBeenCalledTimes(6);
  });
  it.each([
    null, 'http://localhost:3101', 'http://127.0.0.1:3101', 'http://[::1]:3101',
    'https://localhost:3100', 'http://localhost.evil.example:3100',
    'http://127.0.0.2:3100', 'http://[::2]:3100', 'https://finflo.org',
    'http://*.localhost:3100',
  ])('rejects a foreign origin even during local development: %s', async requestOrigin => {
    vi.stubEnv('BETTER_AUTH_URL', 'http://127.0.0.1:3100');
    const response = await POST(post('sign-in/email', '{}', requestOrigin, 'http://localhost:3100'));
    expect(response.status).toBe(403);
    expect(state.handler).not.toHaveBeenCalled();
  });
  it('bounds the actual streamed body when Content-Length is absent', async () => {
    const response = await POST(post('sign-in/email', JSON.stringify({email: 'fictional@example.com', password: 'x'.repeat(10_000)})));
    expect(response.status).toBe(413);
    expect(state.handler).not.toHaveBeenCalled();
  });
  it('preserves a valid body and wraps successful responses with private/noindex headers', async () => {
    const body = JSON.stringify({email: 'fictional@example.com', password: 'a fictional password'});
    state.handler.mockImplementation(async request => {
      expect(await request.text()).toBe(body);
      return Response.json({ok: true}, {headers: {'set-cookie': 'session=example; HttpOnly; Secure'}});
    });
    const response = await POST(post('sign-in/email', body));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('x-robots-tag')).toContain('noindex');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
  });
  it('returns generic credential errors without exposing the library response', async () => {
    state.handler.mockResolvedValue(Response.json({message: 'private account lookup details'}, {status: 400}));
    const response = await POST(post('sign-in/email'));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({message: 'Email or password is incorrect.'});
  });
  it('does not leak provider errors through session or sign-out responses', async () => {
    state.handler.mockImplementation(async () => Response.json({message: 'private database URL and credentials'}, {status: 500}));
    for (const request of [new Request(origin + '/api/auth/get-session'), post('sign-out')]) {
      const response = request.method === 'GET' ? await GET(request) : await POST(request);
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({message: 'Admin authentication is temporarily unavailable.'});
    }
  });
  it('permits only the read-only session GET and fails closed if unconfigured', async () => {
    expect((await GET(new Request(origin + '/api/auth/sign-in/email'))).status).toBe(404);
    expect((await GET(new Request(origin + '/api/auth/get-session'))).status).toBe(200);
    state.configured = false;
    expect((await POST(post('sign-in/email'))).status).toBe(503);
  });
});
