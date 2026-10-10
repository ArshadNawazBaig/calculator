import {afterEach, describe, expect, it, vi} from 'vitest';

const request = (body: string, headers: Record<string, string> = {}) => new Request('http://localhost:3200/api/road-route', {method: 'POST', headers: {'content-type': 'application/json', ...headers}, body});
const validSearch = JSON.stringify({kind: 'search', query: 'Cambridge'});
afterEach(() => {vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules();});

describe('Map API request boundary', () => {
  it('accepts the configured public origin behind a reverse proxy and keeps the response private', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://finflo.org');
    const fetcher = vi.fn().mockResolvedValue(Response.json([{lat: '52.2', lon: '.12', display_name: 'Cambridge, UK'}]));
    vi.stubGlobal('fetch', fetcher);
    const {POST} = await import('@/app/api/road-route/route');
    const response = await POST(request(validSearch, {origin: 'https://finflo.org'}));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex');
    expect(await response.json()).toEqual({places: [{lat: 52.2, lon: .12, label: 'Cambridge, UK'}]});
  });
  it('rejects a foreign origin even with a matching forged forwarded host', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const {POST} = await import('@/app/api/road-route/route');
    const response = await POST(request(validSearch, {origin: 'https://other.example', 'x-forwarded-host': 'other.example'}));
    expect(response.status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('can disable external routing without contacting providers', async () => {
    vi.stubEnv('ROAD_ROUTING_ENABLED', 'false');
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const {POST} = await import('@/app/api/road-route/route');
    expect((await POST(request(validSearch))).status).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
  });
  for (const [body, headers, status] of [
    [validSearch, {'content-type': 'text/plain'}, 400],
    ['{broken', {}, 400],
    ['null', {}, 400],
    [JSON.stringify({kind: 'search', query: 'x'.repeat(4100)}), {}, 413],
    [JSON.stringify({kind: 'route', from: {lat: 91, lon: 0}, to: {lat: 0, lon: 0}}), {}, 400],
    [JSON.stringify({kind: 'unknown'}), {}, 400],
  ] as [string, Record<string, string>, number][]) it(`rejects invalid payload with ${status} without contacting providers: ${body.slice(0, 40)}`, async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const {POST} = await import('@/app/api/road-route/route');
    expect((await POST(request(body, headers))).status).toBe(status);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('returns Retry-After when the provider rate limit is reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', {status: 429})));
    const {POST} = await import('@/app/api/road-route/route');
    const response = await POST(request(validSearch));
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('5');
  });
});
