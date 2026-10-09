import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import fixtures from './fixtures/currency-global-reference.json';
import {
  applyInverseQuote, FRANKFURTER_RATES, globalConversion, parseFrankfurterRows,
  parseSiiUf, validObservation, validateGlobalRates,
  type GlobalQuote, type GlobalRates,
} from '@/lib/data/global-rates';

const NOW = Date.parse('2026-10-09T12:00:00Z');
const DAY = 86400000;
const quote = (code: string, usdPerUnit: string, date = '2026-10-09', kind: GlobalQuote['kind'] = 'daily-reference'): GlobalQuote => ({
  code, usdPerUnit, date, kind, source: 'Independent test reference', contributors: [], pegDerived: false,
});
const snapshot = (quotes: GlobalRates['quotes'] = {}, retrievedAt = new Date(NOW).toISOString()): GlobalRates => ({
  retrievedAt, quotes: {USD: quote('USD', '1'), ...quotes}, missing: [],
});
const row = (extra: Record<string, unknown> = {}) => ({
  base: 'USD', quote: 'EUR', rate: .8, date: '2026-10-09',
  providers: [{key: 'ECB', date: '2026-10-08', rate: .8}], ...extra,
});
const json = (value: unknown) => Response.json(value);

// Original minimal markup exercises the documented alternating day/value layout.
// Factual October values are independently pinned from the official SII table.
const ufHtml = `<h2>UF 2026</h2>
<div id="mes_octubre"><table>
<tr><th colspan="6">Octubre</th></tr>
<tr><th>1</th><td>41.065,38</td><th><strong>9</strong></th><td>41.130,94</td><th>10</th><td> </td></tr>
</table></div>
<div id="mes_septiembre"><table><tr><th>1</th><td>40.000,00</td><th>11</th><td>40.100,00</td><th>21</th><td>40.983,58</td></tr></table></div>`;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.resetModules();
  vi.stubGlobal('fetch', vi.fn(async () => {throw Error('Unexpected network access in a currency test.');}));
});
afterEach(() => {vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();});

describe('Independent currency arithmetic and quote precision', () => {
  for (const fixture of fixtures.cases) it(fixture.id, () => {
    const quotes = Object.fromEntries(Object.entries(fixture.usdPerUnit).map(([code, value]) => [code, quote(code, value!)]));
    const result = globalConversion(fixture.amount, fixture.from, fixture.to, snapshot(quotes));
    const expected = Number(fixture.expectedConverted);
    expect(Math.abs(result.converted - expected)).toBeLessThanOrEqual(Math.max(fixture.absoluteTolerance, Math.abs(expected) * fixture.relativeTolerance));
  });

  it('uses a direct gold quote to avoid the coarse USD/XAU inverse', () => {
    const coarse = parseFrankfurterRows([row({quote: 'XAU', rate: .00024})], NOW)[0];
    const precise = applyInverseQuote(coarse, {base: 'XAU', quote: 'USD', rate: 4138.78, date: '2026-10-09', providers: [{key: 'NBP', date: '2026-10-09', rate: 4137.54}]}, NOW);
    expect(precise.usdPerUnit).toBe('4138.78');
    expect(globalConversion(2, 'XAU', 'USD', snapshot({XAU: precise})).converted).toBeCloseTo(8277.56, 10);
  });

  it('keeps sufficient precision when normalizing the direct VND quote', () => {
    const vnd = parseFrankfurterRows([row({quote: 'VND', rate: 25868})], NOW)[0];
    expect(globalConversion(25868, 'VND', 'USD', snapshot({VND: vnd})).converted).toBeCloseTo(1, 14);
    expect(vnd.usdPerUnit).not.toBe('0.000039');
  });

  it.each([0, -1, Infinity, NaN])('rejects the invalid provider rate %s', rate => {
    expect(() => parseFrankfurterRows([row({rate})], NOW)).toThrow();
  });

  it('rejects duplicate codes, wrong bases, unavailable instruments and numeric underflow', () => {
    expect(() => parseFrankfurterRows([row(), row()], NOW)).toThrow();
    expect(() => parseFrankfurterRows([row({base: 'EUR'})], NOW)).toThrow();
    expect(() => globalConversion(100, 'BGN', 'USD', snapshot())).toThrow(/manual|current quote/i);
    expect(() => globalConversion(1, 'EUR', 'JPY', snapshot({EUR: quote('EUR', '1e-308'), JPY: quote('JPY', '1e308')}))).toThrow(/range/i);
    expect(() => validateGlobalRates(snapshot({EUR: quote('EUR', '1e-1000')}), NOW)).toThrow();
  });
});

describe('Observation dates, freshness and raw attribution', () => {
  it.each(['2026-02-30', '2026-13-01', '2026-10-10', '2026-11-01', '2026-09-24'])('rejects invalid/future/expired observation %s', date => {
    expect(validObservation(date, NOW)).toBe(false);
  });

  it('retains publication lag and preserves older contributors without relabeling them', () => {
    expect(validObservation('2026-10-02', NOW)).toBe(true);
    const providers = [{key: 'ECB', date: '2026-10-08', rate: .8}, {key: 'LB', date: '2026-09-29', rate: .81, excluded: true}];
    const parsed = parseFrankfurterRows([row({providers})], NOW)[0];
    expect(parsed.date).toBe('2026-10-09');
    expect(parsed.contributors).toEqual(providers);
    expect(parsed.pegDerived).toBe(false);
  });

  it('validates contributor calendar dates and exclusion types', () => {
    expect(() => parseFrankfurterRows([row({providers: [{key: 'ECB', date: '2026-02-30'}]})], NOW)).toThrow();
    expect(() => parseFrankfurterRows([row({providers: [{key: 'ECB', excluded: 'false'}]})], NOW)).toThrow();
  });

  it('replaces attribution and peg status when an inverse quote replaces a blend', () => {
    const original = parseFrankfurterRows([row()], NOW)[0];
    const providers = [{key: 'NBP', date: '2026-10-07', rate: 1.25, excluded: true}];
    const inverse = applyInverseQuote(original, {base: 'EUR', quote: 'USD', date: '2026-10-09', rate: 1.25, providers}, NOW);
    expect(inverse.contributors).toEqual(providers);
    expect(inverse.pegDerived).toBe(true);
    // Frankfurter documents omitted expanded providers as a peg-derived quote.
    expect(parseFrankfurterRows([row({quote: 'GGP', providers: undefined})], NOW)[0].pegDerived).toBe(true);
  });

  it('rejects future retrievals and structurally invalid data before freshness pruning', () => {
    expect(() => validateGlobalRates(snapshot({}, '2030-01-01T00:00:00Z'), NOW)).toThrow();
    expect(() => validateGlobalRates(snapshot({EUR: quote('EUR', '0', '2020-01-01')}), NOW)).toThrow();
    expect(() => validateGlobalRates(snapshot({EUR: {...quote('EUR', '1.25'), date: '2026-10-10'}}), NOW)).toThrow();
  });

  it('expires each quote independently and preserves USD identity without mutating its input', () => {
    const original = snapshot({EUR: quote('EUR', '1.25', '2026-09-27'), JPY: quote('JPY', '0.006666666666666667'), BTC: quote('BTC', '83005.615', '2026-10-09', 'spot')});
    const pruned = validateGlobalRates(original, NOW + 3 * DAY);
    expect(Object.keys(pruned.quotes).sort()).toEqual(['JPY', 'USD']);
    expect(pruned.missing).toEqual(expect.arrayContaining(['EUR', 'BTC']));
    expect(original.quotes.EUR).toBeDefined();
    expect(original.quotes.BTC).toBeDefined();
  });

  it('applies the 15-minute spot boundary without expiring daily references', () => {
    const data = snapshot({EUR: quote('EUR', '1.25'), BTC: quote('BTC', '83005.615', '2026-10-09', 'spot')});
    expect(validateGlobalRates(data, NOW + 900000).quotes.BTC).toBeDefined();
    const later = validateGlobalRates(data, NOW + 900001);
    expect(later.quotes.BTC).toBeUndefined();
    expect(later.quotes.EUR).toBeDefined();
  });
});

describe('Official Chilean UF parsing', () => {
  it.each([['2026-10-09', '41130.94'], ['2026-10-01', '41065.38'], ['2026-09-21', '40983.58']])('parses the exact date %s across multi-column day cells', (date, expected) => {
    expect(parseSiiUf(ufHtml, date)).toBe(expected);
  });

  it('rejects blank, wrong-year, malformed, missing and nonpositive observations', () => {
    expect(() => parseSiiUf(ufHtml, '2026-10-10')).toThrow();
    expect(() => parseSiiUf(ufHtml.replace('UF 2026', 'UF 2025'), '2026-10-09')).toThrow();
    expect(() => parseSiiUf(ufHtml, '2026-11-01')).toThrow();
    expect(() => parseSiiUf(ufHtml, '2026-02-30')).toThrow();
    for (const replacement of ['0,00', 'NaN', '41,130.94']) expect(() => parseSiiUf(ufHtml.replace('41.130,94', replacement), '2026-10-09')).toThrow();
  });
});

describe('Browser snapshot cache and local calculation', () => {
  it('requests one generic snapshot without amount or selected currencies and reuses it', async () => {
    const fetcher = vi.fn(async () => json(snapshot({EUR: quote('EUR', '1.25')})));
    vi.stubGlobal('fetch', fetcher);
    const {runGlobalCurrency} = await import('@/lib/calculators/currency-global');
    const result = await runGlobalCurrency({amount: '1234.56', from: 'EUR', to: 'USD', tableView: 'rates', currencyList: 'popular'});
    expect(result.metrics[0].value).toBeCloseTo(1543.2, 10);
    await runGlobalCurrency({amount: '50', from: 'USD', to: 'EUR', tableView: 'providers', currencyList: 'all'});
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('/api/global-rates', {signal: expect.any(AbortSignal)});
  });

  it('converts the same instrument offline without requesting a quote', async () => {
    const {runGlobalCurrency} = await import('@/lib/calculators/currency-global');
    const result = await runGlobalCurrency({amount: '123.45', from: 'USD', to: 'USD', tableView: 'rates', currencyList: 'popular'});
    expect(result.metrics[0].value).toBe(123.45);
    expect(result.metrics[1].value).toBe(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses valid cached daily pairs after network failure and drops expired Bitcoin', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json(snapshot({EUR: quote('EUR', '1.25'), BTC: quote('BTC', '83005.615', '2026-10-09', 'spot')}))).mockRejectedValue(Error('offline'));
    vi.stubGlobal('fetch', fetcher);
    const {getGlobalRates} = await import('@/lib/data/global-rates-client');
    await getGlobalRates();
    vi.setSystemTime(NOW + 16 * 60000);
    const fallback = await getGlobalRates();
    expect(fallback.cached).toBe(true);
    expect(fallback.quotes.BTC).toBeUndefined();
    expect(globalConversion(80, 'EUR', 'USD', fallback).converted).toBe(100);
  });

  it('prunes one expired daily quote while retaining other cached pairs', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json(snapshot({EUR: quote('EUR', '1.25', '2026-09-27'), JPY: quote('JPY', '0.006666666666666667')}))).mockRejectedValue(Error('offline'));
    vi.stubGlobal('fetch', fetcher);
    const {getGlobalRates} = await import('@/lib/data/global-rates-client');
    await getGlobalRates();
    vi.setSystemTime(NOW + 3 * DAY);
    const fallback = await getGlobalRates();
    expect(fallback.quotes.EUR).toBeUndefined();
    expect(fallback.quotes.JPY).toBeDefined();
  });

  it('keeps its last valid snapshot when a refresh response is structurally corrupt', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json(snapshot({EUR: quote('EUR', '1.25')}))).mockResolvedValueOnce(json(snapshot({EUR: quote('EUR', '0')})));
    vi.stubGlobal('fetch', fetcher);
    const {getGlobalRates} = await import('@/lib/data/global-rates-client');
    await getGlobalRates();
    vi.setSystemTime(NOW + 6 * 60000);
    expect((await getGlobalRates()).quotes.EUR.usdPerUnit).toBe('1.25');
  });
});

describe('Global endpoint with mocked public providers', () => {
  function providerFetch({fail = '', html = ufHtml}: {fail?: string; html?: string} = {}) {
    return vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (fail && url.includes(fail)) return new Response('', {status: 503});
      const date = new Date().toISOString().slice(0, 10);
      if (url === FRANKFURTER_RATES) return json([row({date}), row({quote: 'CLP', rate: 900, date}), {base: 'USD', quote: 'USD', rate: 1, date}]);
      if (url.includes('/rate/eur/usd')) return json({base: 'EUR', quote: 'USD', rate: 1.25, date, providers: [{key: 'ECB', date, rate: 1.25}]});
      if (url.includes('coinbase')) return json({data: {base: 'BTC', currency: 'USD', amount: '83005.615'}});
      if (url.includes('sii.cl')) return new Response(html);
      throw Error('Unexpected provider URL: ' + url);
    });
  }

  it('normalizes separate sources, preserves USD identity, and declares cache/noindex headers', async () => {
    vi.stubGlobal('fetch', providerFetch());
    const {GET} = await import('@/app/api/global-rates/route');
    const response = await GET(), data = await response.json() as GlobalRates;
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
    expect(response.headers.get('Cache-Control')).toContain('max-age=60');
    expect(data.quotes.USD.source).toBe('USD reference identity');
    expect(data.quotes.USD.pegDerived).toBe(false);
    expect(data.quotes.EUR.usdPerUnit).toBe('1.25');
    expect(data.quotes.BTC.kind).toBe('spot');
    expect(globalConversion(2, 'CLF', 'CLP', data).converted).toBeCloseTo(82261.88, 8);
  });

  it.each([['coinbase', 'BTC'], ['sii.cl', 'CLF'], ['/rate/eur/usd', 'EUR']])('isolates %s failure to the affected instrument', async (fail, code) => {
    vi.stubGlobal('fetch', providerFetch({fail}));
    const {GET} = await import('@/app/api/global-rates/route');
    const response = await GET(), data = await response.json() as GlobalRates;
    expect(response.status).toBe(200);
    expect(data.quotes[code]).toBeUndefined();
    expect(data.missing).toContain(code);
    expect(data.quotes.CLP).toBeDefined();
    expect(data.quotes.USD).toBeDefined();
  });

  it('returns a clear uncached 503 when its primary snapshot is unavailable', async () => {
    vi.stubGlobal('fetch', providerFetch({fail: '/v2/rates?'}));
    const {GET} = await import('@/app/api/global-rates/route');
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  it('uses the current Santiago day before midnight rather than the next UTC day', async () => {
    vi.setSystemTime(new Date('2026-10-10T01:00:00Z'));
    vi.stubGlobal('fetch', providerFetch());
    const {GET} = await import('@/app/api/global-rates/route');
    const data = await (await GET()).json() as GlobalRates;
    expect(data.quotes.CLF.date).toBe('2026-10-09');
    expect(data.quotes.CLF.source).toContain('41130.94 CLP per UF on 2026-10-09');
  });

  it('uses the previous Chilean year during the UTC New Year boundary', async () => {
    vi.setSystemTime(new Date('2027-01-01T01:00:00Z'));
    const fetcher = providerFetch({html: '<h2>UF 2026</h2><div id="mes_diciembre"><table><tr><th>31</th><td>40.000,00</td></tr></table></div>'});
    vi.stubGlobal('fetch', fetcher);
    const {GET} = await import('@/app/api/global-rates/route');
    const data = await (await GET()).json() as GlobalRates;
    expect(data.quotes.CLF.date).toBe('2026-12-31');
    const urls = fetcher.mock.calls.map(call => String(call[0]));
    expect(urls).toContain('https://www.sii.cl/valores_y_fechas/uf/uf2026.htm');
    expect(urls.some(url => url.includes('uf2027.htm'))).toBe(false);
  });
});
