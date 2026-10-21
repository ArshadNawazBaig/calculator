import {afterEach, describe, expect, it, vi} from 'vitest';
import {NextRequest} from 'next/server';
import {proxy} from '@/proxy';
import {locales, isPublishedLocale} from '@/lib/i18n/config';

afterEach(() => vi.unstubAllEnvs());

describe('production indexing', () => {
  it('redirects legacy 401K spelling to a published canonical URL without looping', () => {
    for (const prefix of ['', '/es', '/fr', '/de', '/pt', '/ar', '/hi', '/tl']) {
      const old = proxy(new NextRequest(`https://finflo.org${prefix}/401K-calculator?example=1`));
      expect(old.status).toBe(prefix ? 307 : 308);
      expect(old.headers.get('location')).toBe('https://finflo.org/401k-calculator?example=1');
      const canonical = proxy(new NextRequest('https://finflo.org/401k-calculator'));
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

  it('redirects withdrawn languages before serving the published maintenance page', () => {
    vi.stubEnv('MAINTENANCE_MODE', 'true');
    for (const prefix of ['', '/es', '/fr', '/de', '/pt', '/ar', '/hi', '/tl']) {
      let response = proxy(new NextRequest(`https://finflo.org${prefix}/grade-calculator`));
      if (prefix) {
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe('https://finflo.org/grade-calculator');
        response = proxy(new NextRequest(response.headers.get('location')!));
      }
      expect(response.status).toBe(503);
      expect(response.headers.get('x-middleware-rewrite')).toBe('https://finflo.org/maintenance');
      const maintenance = proxy(new NextRequest('https://finflo.org/maintenance'));
      expect(maintenance.status).toBe(503);
      expect(maintenance.headers.get('x-middleware-rewrite')).toBeNull();
      expect(maintenance.headers.get('Cache-Control')).toBe('no-store');
    }
  });

  it('temporarily redirects every withdrawn locale, including unknown paths, without changing query intent', () => {
    for (const locale of locales.filter(locale => !isPublishedLocale(locale))) {
      for (const path of ['', '/grade-calculator', '/time/asia-karachi', '/unknown-route']) {
        const response = proxy(new NextRequest(`https://finflo.org/${locale}${path}?mode=points&term=a%2Bb&term=c`));
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(`https://finflo.org${path || '/'}?mode=points&term=a%2Bb&term=c`);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(response.headers.get('x-robots-tag')).toBe('noindex, follow');
      }
    }
  });

  it('serves the same publication redirects to users and crawlers and leaves APIs available', () => {
    for (const userAgent of ['Mozilla/5.0', 'Googlebot', 'Mediapartners-Google']) {
      const response = proxy(new NextRequest('https://finflo.org/tl/volume-calculator', {headers: {'user-agent': userAgent}}));
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('https://finflo.org/volume-calculator');
    }
    expect(proxy(new NextRequest('https://finflo.org/api/health')).status).toBe(200);
  });
});
