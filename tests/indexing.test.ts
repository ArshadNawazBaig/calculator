import {afterEach, describe, expect, it, vi} from 'vitest';
import {NextRequest} from 'next/server';
import {proxy} from '@/proxy';
import {locales, localizedPath} from '@/lib/i18n/config';

afterEach(() => vi.unstubAllEnvs());

describe('production indexing', () => {
  it('redirects legacy 401K spelling to a published canonical URL without looping', () => {
    for (const prefix of ['', '/es', '/fr', '/de', '/pt', '/ar', '/hi', '/tl']) {
      const old = proxy(new NextRequest(`https://finflo.org${prefix}/401K-calculator?example=1`));
      expect(old.status).toBe(308);
      expect(old.headers.get('location')).toBe(`https://finflo.org${prefix}/401k-calculator?example=1`);
      const canonical = proxy(new NextRequest(`https://finflo.org${prefix}/401k-calculator`));
      expect(canonical.status).toBe(200);
      expect(canonical.headers.get('location')).toBeNull();
    }
  });
  it('allows the canonical host while keeping preview addresses out of search', () => {
    vi.stubEnv('NEXT_PUBLIC_INDEXABLE', 'true');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://finflo.org');
    vi.stubEnv('MAINTENANCE_MODE', 'false');
    // A reverse proxy can send an internal URL alongside the public Host header.
    const canonical = new NextRequest('http://localhost:8080/mortgage-calculator', {headers: {host: 'finflo.org'}});
    expect(proxy(canonical).headers.get('X-Robots-Tag')).toBeNull();
    for (const host of ['finflo-production-16af.up.railway.app', 'localhost:3000', 'finflo.org.example.com']) {
      const request = new NextRequest('http://localhost:8080/mortgage-calculator', {headers: {host}});
      expect(proxy(request).headers.get('X-Robots-Tag')).toBe('noindex, follow');
    }
  });

  it('keeps indexing disabled until the production setting is enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_INDEXABLE', 'false');
    expect(proxy(new NextRequest('https://finflo.org/')).headers.get('X-Robots-Tag')).toBe('noindex, follow');
  });

  it('returns a temporary unavailable response during maintenance', () => {
    vi.stubEnv('NEXT_PUBLIC_INDEXABLE', 'true');
    vi.stubEnv('MAINTENANCE_MODE', 'true');
    const response = proxy(new NextRequest('https://finflo.org/mortgage-calculator'));
    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBe('300');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
    expect(proxy(new NextRequest('https://finflo.org/api/health')).status).toBe(200);
  });

  it('serves the maintenance page in each requested language', () => {
    vi.stubEnv('MAINTENANCE_MODE', 'true');
    for (const locale of locales) {
      const response = proxy(new NextRequest(`https://finflo.org${localizedPath('/grade-calculator', locale)}`));
      const maintenanceUrl = `https://finflo.org${localizedPath('/maintenance', locale)}`;
      expect(response.status).toBe(503);
      expect(response.headers.get('x-middleware-rewrite')).toBe(maintenanceUrl);
      const maintenance = proxy(new NextRequest(maintenanceUrl));
      expect(maintenance.status).toBe(503);
      expect(maintenance.headers.get('x-middleware-rewrite')).toBeNull();
      expect(maintenance.headers.get('Cache-Control')).toBe('no-store');
    }
  });

  it('keeps published locale URLs intact, including query parameters', () => {
    vi.stubEnv('NEXT_PUBLIC_INDEXABLE', 'true');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://finflo.org');
    for (const locale of locales) {
      for (const path of ['/', '/grade-calculator', '/time/asia-karachi', '/unknown-route']) {
        const response = proxy(new NextRequest(`https://finflo.org${localizedPath(path, locale)}?mode=points&term=a%2Bb&term=c`));
        expect(response.status).toBe(200);
        expect(response.headers.get('location')).toBeNull();
        expect(response.headers.get('x-robots-tag')).toBeNull();
      }
    }
  });

  it('serves the same published languages to users and crawlers and leaves APIs available', () => {
    for (const userAgent of ['Mozilla/5.0', 'Googlebot', 'Mediapartners-Google']) {
      const response = proxy(new NextRequest('https://finflo.org/tl/volume-calculator', {headers: {'user-agent': userAgent}}));
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    }
    expect(proxy(new NextRequest('https://finflo.org/api/health')).status).toBe(200);
  });
});
