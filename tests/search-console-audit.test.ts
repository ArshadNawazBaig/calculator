import {describe, expect, it} from 'vitest';
import {analyzeSearchConsole, parseCsv} from '../scripts/analyze-search-console.mjs';

const row = (label: string, value: string, clicks: number, impressions: number, position: number | null) => ({[label]: value, Clicks: String(clicks), Impressions: String(impressions), CTR: '0%', Position: position === null ? '' : String(position)});

function fixture() {
  return {
    chart: Array.from({length: 14}, (_, index) => row('Date', `2026-10-${String(index + 1).padStart(2, '0')}`, index < 7 ? 1 : 3, index < 7 ? 100 : 200, index < 7 ? 10 : 5)),
    pages: [row('Top pages', 'https://finflo.org/area-calculator', 4, 2000, 10), row('Top pages', 'https://finflo.org/es/area-calculator', 0, 200, 40)],
    queries: [row('Top queries', 'area calculator', 3, 1000, 5)],
    countries: [row('Country', 'United States', 28, 2100, 7)],
    devices: [row('Device', 'Desktop', 28, 2100, 7)],
    appearance: [],
    filters: [{Filter: 'Search type', Value: 'Web (text-based)'}],
  };
}

describe('Search Console CSV audit', () => {
  it('reads BOM, escaped quotes, commas, CRLF, embedded newlines, and final empty cells', () => {
    const rows = parseCsv('\uFEFFQuery,Clicks,Impressions,Position\r\n"a, ""quoted""\r\nquery",2,"1,234",5\r\nplain,0,0,\r\n');
    expect(rows).toEqual([
      {Query: 'a, "quoted"\r\nquery', Clicks: '2', Impressions: '1,234', Position: '5'},
      {Query: 'plain', Clicks: '0', Impressions: '0', Position: ''},
    ]);
    expect(parseCsv('Query,Clicks\n', ['Query', 'Clicks'])).toEqual([]);
  });

  it('rejects malformed rows, quotes, duplicate headers, and missing required columns', () => {
    for (const text of ['a,a\n1,2', 'a,b\n1', 'a,b\n"unfinished,2', 'a,b\n"closed"junk,2']) expect(() => parseCsv(text)).toThrow();
    expect(() => parseCsv('Wrong,Clicks\n', ['Query', 'Clicks'])).toThrow('required English export column');
  });

  it('keeps property, page, and query aggregation separate and recomputes CTR from counts', () => {
    const report = analyzeSearchConsole(fixture());
    expect(report.baseline).toMatchObject({start: '2026-10-01', end: '2026-10-14', impressions: 2100, clicks: 28, complete: true, impressionsPerDay: 150, clicksPerDay: 2});
    expect(report.baseline.ctrPercent).toBeCloseTo(28 / 2100 * 100);
    expect(report.baseline.approximateAveragePosition).toBeCloseTo(20 / 3);
    expect(report.tableTotals.pages).toMatchObject({impressions: 2200, clicks: 4});
    expect(report.tableTotals.queries).toMatchObject({impressions: 1000, clicks: 3});
    expect(report.queryCoverage.representedImpressionPercent).toBeCloseTo(1000 / 2100 * 100);
    expect(report.locales).toEqual(expect.arrayContaining([expect.objectContaining({locale: 'es', impressions: 200, clicks: 0})]));
  });

  it('uses complete calendar weeks and labels target arithmetic independently from traffic predictions', () => {
    const report = analyzeSearchConsole(fixture());
    expect(report.trend.current7Days).toMatchObject({start: '2026-10-08', end: '2026-10-14', impressionsPerDay: 200, clicksPerDay: 3});
    expect(report.trend.previous7Days).toMatchObject({start: '2026-10-01', end: '2026-10-07', impressionsPerDay: 100, clicksPerDay: 1});
    expect(report.trend.changes).toMatchObject({impressionsPercent: 100, clicksPercent: 200, ctrPercentagePoints: 0.5});
    expect(report.targets.requiredCtrPercent).toBeCloseTo(5 / 3);
    expect(report.targets.impressionsGrowthMultiple).toBe(150);
    expect(report.targets.clicksGrowthMultiple).toBeCloseTo(500 / 3);
    expect(report.targets.clicksPer30DaysAt500PerDay).toBe(15_000);
    expect(report.prioritization.pages[0]).toMatchObject({label: 'https://finflo.org/area-calculator', reviewScore: 200});
  });

  it('never fills missing dates with zero traffic or divides growth by zero', () => {
    const tables = fixture();
    tables.chart = tables.chart.filter(item => item.Date !== '2026-10-10');
    let report = analyzeSearchConsole(tables);
    expect(report.trend.current7Days).toMatchObject({complete: false, reportedDays: 6, impressionsPerDay: null});
    expect(report.trend.changes).toBeNull();
    expect(report.targets.impressionsGrowthMultiple).toBeNull();
    tables.chart = Array.from({length: 14}, (_, index) => row('Date', `2026-10-${String(index + 1).padStart(2, '0')}`, 0, 0, null));
    report = analyzeSearchConsole(tables);
    expect(report.baseline.ctrPercent).toBeNull();
    expect(report.trend.changes?.impressionsPercent).toBeNull();
    expect(report.targets.clicksGrowthMultiple).toBeNull();
  });

  it('rejects duplicate or invalid dates and invalid counts instead of silently altering totals', () => {
    const tables = fixture();
    tables.chart.push({...tables.chart[0]});
    expect(() => analyzeSearchConsole(tables)).toThrow('duplicate dates');
    tables.chart = [row('Date', '2026-02-30', 0, 0, null)];
    expect(() => analyzeSearchConsole(tables)).toThrow('Invalid chart date');
    tables.chart = [row('Date', '2026-02-01', -1, 5, 2)];
    expect(() => analyzeSearchConsole(tables)).toThrow('Invalid numeric value');
  });

  it('flags the query export row limit without claiming complete query coverage', () => {
    const tables = fixture();
    tables.queries = Array.from({length: 1000}, (_, index) => row('Top queries', `query ${index}`, 0, 1, 20));
    const report = analyzeSearchConsole(tables);
    expect(report.queryCoverage).toMatchObject({rowCount: 1000, possibleRowLimit: true});
    expect(report.warnings.some(warning => warning.includes('Queries.csv') && warning.includes('1,000-row'))).toBe(true);
  });
});
