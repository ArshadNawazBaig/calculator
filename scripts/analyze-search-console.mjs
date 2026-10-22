import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const DAY = 86_400_000;
const files = {
  chart: ['Chart.csv', 'Date'],
  pages: ['Pages.csv', 'Top pages'],
  queries: ['Queries.csv', 'Top queries'],
  countries: ['Countries.csv', 'Country'],
  devices: ['Devices.csv', 'Device'],
  appearance: ['Search appearance.csv', 'Search Appearance'],
  filters: ['Filters.csv', 'Filter'],
};

/** Parse exported CSV without treating cell values as executable instructions. */
export function parseCsv(input, requiredHeaders = []) {
  const text = input.replace(/^\uFEFF/, '');
  const records = [];
  let row = [], field = '', quoted = false, closedQuote = false;
  const endField = () => { row.push(field); field = ''; closedQuote = false; };
  const endRow = () => {
    endField();
    if (row.some(value => value !== '')) records.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') { quoted = false; closedQuote = true; }
      else field += char;
    } else if (char === ',') endField();
    else if (char === '\n' || char === '\r') {
      endRow();
      if (char === '\r' && text[i + 1] === '\n') i++;
    } else if (char === '"' && field === '' && !closedQuote) quoted = true;
    else {
      if (closedQuote || char === '"') throw new Error('Malformed CSV: unexpected text or quote outside a quoted field.');
      field += char;
    }
  }
  if (quoted) throw new Error('Malformed CSV: unterminated quoted field.');
  if (row.length || field || closedQuote) endRow();
  const headers = records.shift();
  if (!headers) throw new Error('CSV is empty or missing its header.');
  if (headers.some(header => !header) || new Set(headers).size !== headers.length) throw new Error('CSV headers must be nonempty and unique.');
  if (requiredHeaders.some(header => !headers.includes(header))) throw new Error('CSV is missing a required English export column.');
  return records.map((values, index) => {
    if (values.length !== headers.length) throw new Error(`CSV row ${index + 2} has ${values.length} fields; expected ${headers.length}.`);
    return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
  });
}

function number(value, context, integer = false) {
  const cleaned = String(value ?? '').trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(cleaned)) throw new Error(`Invalid numeric value in ${context}.`);
  const result = Number(cleaned.replaceAll(',', ''));
  if (!Number.isFinite(result) || (integer && !Number.isSafeInteger(result))) throw new Error(`Invalid numeric value in ${context}.`);
  return result;
}

function metricRows(rows, key, filename) {
  return rows.map((row, index) => {
    const label = row[key];
    if (!label?.trim()) throw new Error(`Missing ${key} in ${filename} row ${index + 2}.`);
    const clicks = number(row.Clicks, `${filename} Clicks`, true);
    const impressions = number(row.Impressions, `${filename} Impressions`, true);
    const position = row.Position?.trim() ? number(row.Position, `${filename} Position`) : null;
    if (impressions > 0 && (position === null || position < 1)) throw new Error(`Missing or invalid Position in ${filename} row ${index + 2}.`);
    return {label, clicks, impressions, ctrPercent: impressions ? clicks / impressions * 100 : null, position};
  });
}

export function totals(rows) {
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const positionImpressions = rows.reduce((sum, row) => sum + (row.position === null ? 0 : row.impressions), 0);
  return {
    rows: rows.length, clicks, impressions,
    ctrPercent: impressions ? clicks / impressions * 100 : null,
    // Exported row positions are already rounded; this is an approximation.
    approximateAveragePosition: positionImpressions ? rows.reduce((sum, row) => sum + (row.position ?? 0) * row.impressions, 0) / positionImpressions : null,
  };
}

function dateValue(date) {
  const value = Date.parse(date + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(value) || new Date(value).toISOString().slice(0, 10) !== date) throw new Error(`Invalid chart date: ${date}.`);
  return value;
}

function windowSummary(chart, end, days) {
  const start = end - (days - 1) * DAY;
  const rows = chart.filter(row => dateValue(row.label) >= start && dateValue(row.label) <= end);
  const summary = totals(rows);
  const complete = rows.length === days;
  return {
    start: new Date(start).toISOString().slice(0, 10), end: new Date(end).toISOString().slice(0, 10),
    expectedDays: days, reportedDays: rows.length, complete, ...summary,
    impressionsPerDay: complete ? summary.impressions / days : null,
    clicksPerDay: complete ? summary.clicks / days : null,
  };
}

function changePercent(current, previous) { return previous ? (current - previous) / previous * 100 : null; }

function opportunities(rows) {
  return rows.filter(row => row.impressions >= 100 && row.position !== null && row.ctrPercent < 1)
    .map(row => ({
      ...row,
      reviewScore: row.impressions / Math.max(1, row.position),
      focus: row.position <= 20 ? 'Review title, snippet, intent fit, and result usefulness' : 'Improve relevance, content depth, internal links, and rankings',
    }))
    .sort((a, b) => b.reviewScore - a.reviewScore || b.impressions - a.impressions || a.label.localeCompare(b.label))
    .slice(0, 20);
}

function localeOf(url) {
  try {
    const prefix = new URL(url).pathname.split('/')[1];
    return ['en', 'es', 'fr', 'de', 'pt', 'ar', 'hi', 'tl'].includes(prefix) ? prefix : 'en';
  } catch { return 'unknown'; }
}

/** Tables remain separate: the export does not establish any page/query/device joins. */
export function analyzeSearchConsole(tables) {
  const metrics = Object.fromEntries(Object.entries(files).filter(([name]) => name !== 'filters').map(([name, [filename, key]]) => [name, metricRows(tables[name] ?? [], key, filename)]));
  const chart = metrics.chart.sort((a, b) => a.label.localeCompare(b.label));
  if (!chart.length) throw new Error('Chart.csv must contain at least one date.');
  chart.forEach(row => dateValue(row.label));
  if (new Set(chart.map(row => row.label)).size !== chart.length) throw new Error('Chart.csv contains duplicate dates.');
  const start = dateValue(chart[0].label), end = dateValue(chart.at(-1).label);
  const baseline = windowSummary(chart, end, (end - start) / DAY + 1);
  const current = windowSummary(chart, end, 7), previous = windowSummary(chart, end - 7 * DAY, 7);
  const pageTotals = totals(metrics.pages), queryTotals = totals(metrics.queries);
  const locales = [...new Set(metrics.pages.map(row => localeOf(row.label)))].map(locale => ({locale, ...totals(metrics.pages.filter(row => localeOf(row.label) === locale))}));
  const warnings = [
    'Chart totals are the property baseline. Pages and search appearance use page aggregation; their totals can differ and are not added to the property total.',
    'Query tables omit anonymized queries and may be truncated. Their totals are not the property baseline; a missing query is not evidence of zero demand.',
    'The independent CSV dimensions cannot identify a specific page/query/country/device combination or establish the cause of low CTR.',
    'Positions are averages, not a fixed rank. Aggregated positions are approximate because the exported rows are rounded.',
    'Daily dates follow Search Console reporting dates. Compare complete calendar windows with the same filters; changing query mix can change CTR.',
  ];
  for (const [name, rows] of Object.entries(metrics)) if (name !== 'chart' && rows.length >= 1000) warnings.push(`${files[name][0]} contains ${rows.length} rows and may have reached the standard 1,000-row export limit.`);
  if (!baseline.complete || !current.complete || !previous.complete) warnings.push('One or more date windows are incomplete; no missing date is assumed to be a zero-traffic day. Incomplete-window daily rates and trend comparisons are null.');
  const deviceTotals = totals(metrics.devices), countryTotals = totals(metrics.countries);
  for (const [name, summary] of [['Devices.csv', deviceTotals], ['Countries.csv', countryTotals]]) {
    if (summary.clicks !== baseline.clicks || summary.impressions !== baseline.impressions) warnings.push(`${name} totals differ from Chart.csv; check export filters, truncation, and reporting dates.`);
  }
  const byImpressions = rows => [...rows].sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
  return {
    generatedAt: new Date().toISOString(),
    source: 'Google Search Console CSV export',
    filters: tables.filters ?? [],
    baseline,
    trend: {current7Days: current, previous7Days: previous, changes: current.complete && previous.complete ? {
      impressionsPercent: changePercent(current.impressions, previous.impressions),
      clicksPercent: changePercent(current.clicks, previous.clicks),
      ctrPercentagePoints: current.ctrPercent === null || previous.ctrPercent === null ? null : current.ctrPercent - previous.ctrPercent,
    } : null},
    tableTotals: {pages: pageTotals, queries: queryTotals, devices: deviceTotals, countries: countryTotals, searchAppearance: totals(metrics.appearance)},
    queryCoverage: {rowCount: metrics.queries.length, possibleRowLimit: metrics.queries.length >= 1000, representedClickPercent: baseline.clicks ? queryTotals.clicks / baseline.clicks * 100 : null, representedImpressionPercent: baseline.impressions ? queryTotals.impressions / baseline.impressions * 100 : null},
    prioritization: {
      explanation: 'Review ordering only, not a traffic forecast or CTR benchmark: include rows with at least 100 impressions and CTR below 1%; score = impressions / max(1, average position). Position 20 separates snippet/intent review from deeper ranking work. These thresholds are triage choices.',
      pages: opportunities(metrics.pages), queries: opportunities(metrics.queries),
    },
    topPages: byImpressions(metrics.pages).slice(0, 30),
    topQueries: byImpressions(metrics.queries).slice(0, 30),
    devices: byImpressions(metrics.devices), countries: byImpressions(metrics.countries),
    locales: locales.sort((a, b) => b.impressions - a.impressions),
    localeMethod: 'URL-prefix classification for the existing en/es/fr/de/pt/ar/hi/tl routes; URLs without one of these prefixes are English. This describes historical URL exposure, not current publication status.',
    searchAppearance: metrics.appearance,
    targets: {
      explanation: 'Arithmetic scenarios, not predictions. Growth multiples use the latest complete seven-day window.',
      impressionsPerDay: 30_000, clicksPerDay: 500, requiredCtrPercent: 500 / 30_000 * 100,
      clicksPerDayAtBaselineCtr: baseline.ctrPercent === null ? null : 30_000 * baseline.ctrPercent / 100,
      impressionsGrowthMultiple: current.impressionsPerDay ? 30_000 / current.impressionsPerDay : null,
      clicksGrowthMultiple: current.clicksPerDay ? 500 / current.clicksPerDay : null,
      clicksPer30DaysAt500PerDay: 15_000,
      visitsPerDayForOneMillionPer30Days: 1_000_000 / 30,
      distinction: 'Search clicks and website visits are different metrics. 500 clicks/day equals 15,000 clicks in 30 days; one million monthly visits is a separate target.',
    },
    warnings,
    methodologySources: [
      'https://developers.google.com/search/blog/2022/10/performance-data-deep-dive',
      'https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data',
    ],
  };
}

async function run(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: npm run audit:search -- <export-folder> [--output <report.json>]\nReads the seven standard Search Console CSV exports. Default output: test-results/search-console.json');
    return;
  }
  let folder, output = 'test-results/search-console.json';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output') {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('--output requires a file path.');
      output = args[++i];
    } else if (args[i].startsWith('-')) throw new Error(`Unknown option: ${args[i]}`);
    else if (!folder) folder = args[i];
    else throw new Error('Supply one export folder. Use --output for the report path.');
  }
  if (!folder) throw new Error('Supply an export folder: npm run audit:search -- <export-folder>');
  const loaded = await Promise.all(Object.entries(files).map(async ([key, [filename, label]]) => {
    const text = await readFile(resolve(folder, filename), 'utf8');
    const required = key === 'filters' ? [label, 'Value'] : [label, 'Clicks', 'Impressions', 'CTR', 'Position'];
    // Header validation also covers an empty Search appearance table.
    const rows = parseCsv(text, required);
    return [key, rows];
  }));
  const report = analyzeSearchConsole(Object.fromEntries(loaded));
  const outputPath = resolve(output);
  if (Object.values(files).some(([filename]) => outputPath === resolve(folder, filename))) throw new Error('The report output cannot overwrite a source CSV.');
  await mkdir(dirname(outputPath), {recursive: true});
  await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({output: outputPath, baseline: report.baseline, latest7Days: report.trend.current7Days, targetCtrPercent: report.targets.requiredCtrPercent, priorityPages: report.prioritization.pages.slice(0, 5).map(row => row.label)}, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2)).catch(error => { console.error(`Search Console audit failed: ${error.message}`); process.exitCode = 1; });
}
