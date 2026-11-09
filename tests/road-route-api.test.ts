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
  it('rejects a different loopback origin when preview access is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://finflo.org');
    vi.stubEnv('ROAD_PREVIEW_ORIGIN', '');
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const {POST} = await import('@/app/api/road-route/route');
    expect((await POST(request(validSearch, {origin: 'http://127.0.0.1:3100'}))).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(['http://localhost', 'http://localhost:3100', 'http://127.0.0.1', 'http://127.0.0.1:3100', 'http://[::1]', 'http://[::1]:3100'])('accepts the explicitly configured loopback preview %s', async origin => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://finflo.org');
    vi.stubEnv('ROAD_PREVIEW_ORIGIN', origin);
    const fetcher = vi.fn().mockResolvedValue(Response.json([{lat: '52.2', lon: '.12', display_name: 'Cambridge, UK'}]));
    vi.stubGlobal('fetch', fetcher);
    const {POST} = await import('@/app/api/road-route/route');
    const response = await POST(request(validSearch, {origin}));
    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
  it.each([
    ['http://other.example', 'http://other.example'],
    ['https://localhost:3100', 'https://localhost:3100'],
    ['http://127.0.0.2:3100', 'http://127.0.0.2:3100'],
    ['http://127.1:3100', 'http://127.0.0.1:3100'],
    ['http://localhost.example:3100', 'http://localhost.example:3100'],
    ['http://user@localhost:3100', 'http://localhost:3100'],
    ['http://localhost:3100/', 'http://localhost:3100'],
    ['http://localhost:3100/preview', 'http://localhost:3100'],
    ['http://localhost:3100?preview=1', 'http://localhost:3100'],
    ['http://localhost:3100#preview', 'http://localhost:3100'],
    ['http://localhost:65536', 'http://localhost:3100'],
    ['http://localhost:3100\n', 'http://localhost:3100'],
  ])('ignores an invalid preview setting %j', async (configured, origin) => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://finflo.org');
    vi.stubEnv('ROAD_PREVIEW_ORIGIN', configured);
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const {POST} = await import('@/app/api/road-route/route');
    expect((await POST(request(validSearch, {origin, 'x-forwarded-host': new URL(origin).host}))).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('still rejects a forged foreign origin when a loopback preview is configured', async () => {
    vi.stubEnv('ROAD_PREVIEW_ORIGIN', 'http://127.0.0.1:3100');
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const {POST} = await import('@/app/api/road-route/route');
    expect((await POST(request(validSearch, {origin: 'http://other.example', 'x-forwarded-host': 'other.example'}))).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('does not authorize other loopback hosts or ports', async () => {
    vi.stubEnv('ROAD_PREVIEW_ORIGIN', 'http://127.0.0.1:3100');
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const {POST} = await import('@/app/api/road-route/route');
    for (const origin of ['http://localhost:3100', 'http://127.0.0.1:3101']) expect((await POST(request(validSearch, {origin}))).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('keeps the public origin working when preview configuration is invalid', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://finflo.org');
    vi.stubEnv('ROAD_PREVIEW_ORIGIN', 'http://other.example/preview');
    const fetcher = vi.fn().mockResolvedValue(Response.json([{lat: '52.2', lon: '.12', display_name: 'Cambridge, UK'}]));
    vi.stubGlobal('fetch', fetcher);
    const {POST} = await import('@/app/api/road-route/route');
    expect((await POST(request(validSearch, {origin: 'https://finflo.org'}))).status).toBe(200);
    expect(fetcher).toHaveBeenCalledOnce();
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
