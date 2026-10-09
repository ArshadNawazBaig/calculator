import Decimal from 'decimal.js';
export const FRANKFURTER_RATES = 'https://api.frankfurter.dev/v2/rates?base=USD&expand=providers';
export type Contributor = {key: string; date?: string; rate?: number; excluded?: boolean};
export type GlobalQuote = {code: string; usdPerUnit: string; date: string; kind: 'daily-reference' | 'spot'; source: string; contributors: Contributor[]; pegDerived: boolean; inverseQuote?: boolean};
export type GlobalRates = {retrievedAt: string; quotes: Record<string, GlobalQuote>; missing: string[]; cached?: boolean};
const D = Decimal.clone({precision: 50});
function calendarDate(date: unknown): date is string {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
}
export function validObservation(date: unknown, now = Date.now(), days = 14): date is string {
  if (!calendarDate(date)) return false;
  const time = Date.parse(date);
  return time <= Math.floor(now / 86400000) * 86400000 && now - time <= days * 86400000;
}
export function parseFrankfurterRows(raw: unknown, now = Date.now()): GlobalQuote[] {
  if (!Array.isArray(raw) || raw.length > 500) throw Error('Unrecognized reference-rate snapshot.');
  const seen = new Set<string>();
  return raw.map(row => {
    if (!row || typeof row !== 'object' || row.base !== 'USD' || typeof row.quote !== 'string' || !/^[A-Z]{3}$/.test(row.quote) || seen.has(row.quote) || !validObservation(row.date, now) || typeof row.rate !== 'number' || !Number.isFinite(row.rate) || row.rate <= 0) throw Error('Invalid or outdated reference-rate row.');
    seen.add(row.quote);
    return {code: row.quote, usdPerUnit: new D(1).div(row.rate).toString(), date: row.date, kind: 'daily-reference' as const, source: 'Frankfurter · blended official reference sources', contributors: readContributors(row.providers), pegDerived: !row.providers || row.providers.every((p: Contributor) => p.excluded)};
  });
}
function readContributors(raw: unknown): Contributor[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || raw.length > 150) throw Error('Invalid provider attribution.');
  return raw.map(p => {
    if (typeof p === 'string' && /^[A-Z0-9_-]{1,20}$/.test(p)) return {key: p};
    if (!p || typeof p !== 'object' || typeof p.key !== 'string' || !/^[A-Z0-9_-]{1,20}$/.test(p.key) || (p.date !== undefined && !calendarDate(p.date)) || (p.excluded !== undefined && typeof p.excluded !== 'boolean') || (p.rate !== undefined && (typeof p.rate !== 'number' || !Number.isFinite(p.rate) || p.rate <= 0))) throw Error('Invalid provider attribution.');
    return {key: p.key, ...(p.date ? {date: p.date} : {}), ...(p.rate ? {rate: p.rate} : {}), ...(p.excluded === true ? {excluded: true} : {})};
  });
}
export function applyInverseQuote(quote: GlobalQuote, raw: unknown, now = Date.now()): GlobalQuote {
  const row = raw as {base?: string; quote?: string; rate?: number; date?: string; providers?: unknown};
  if (!row || row.base !== quote.code || row.quote !== 'USD' || !validObservation(row.date, now) || typeof row.rate !== 'number' || !Number.isFinite(row.rate) || row.rate <= 0) throw Error('Invalid inverse reference quote.');
  const contributors = readContributors(row.providers);
  return {...quote, usdPerUnit: String(row.rate), date: row.date, contributors, pegDerived: contributors.length === 0 || contributors.every(p => p.excluded), inverseQuote: true};
}
export function validateGlobalRates(data: GlobalRates, now = Date.now()): GlobalRates {
  if (!data || !Number.isFinite(Date.parse(data.retrievedAt)) || Date.parse(data.retrievedAt) > now || !data.quotes || Object.keys(data.quotes).length > 500 || data.quotes.USD?.usdPerUnit !== '1' || !Array.isArray(data.missing)) throw Error('Invalid global-rate snapshot.');
  const quotes: GlobalRates['quotes'] = {}, missing = new Set(data.missing);
  for (const [key, quote] of Object.entries(data.quotes)) {
    if (!quote || !/^[A-Z]{3}$/.test(key) || quote.code !== key || !['daily-reference', 'spot'].includes(quote.kind) || !calendarDate(quote.date) || Date.parse(quote.date) > Math.floor(now / 86400000) * 86400000 || typeof quote.source !== 'string' || quote.source.length > 200 || typeof quote.pegDerived !== 'boolean' || typeof quote.usdPerUnit !== 'string' || !/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(quote.usdPerUnit) || !new D(quote.usdPerUnit).isPositive() || !Number.isFinite(Number(quote.usdPerUnit)) || Number(quote.usdPerUnit) === 0) throw Error('Invalid global quote.');
    readContributors(quote.contributors);
    if (key !== 'USD' && (!validObservation(quote.date, now) || (quote.kind === 'spot' && now - Date.parse(data.retrievedAt) > 15 * 60 * 1000))) {missing.add(key); continue;}
    quotes[key] = quote; missing.delete(key);
  }
  return {...data, quotes, missing: [...missing]};
}
export function globalConversion(amount: number, from: string, to: string, data: GlobalRates) {
  if (!Number.isFinite(amount) || amount < 0) throw Error('Amount must be a finite nonnegative number.');
  const a = data.quotes[from], b = data.quotes[to];
  if (!a || !b) throw Error('This instrument has no available current quote. Use the manual-rate mode with an explicitly dated source; legacy currencies are not assigned invented current rates.');
  const rate = new D(a.usdPerUnit).div(b.usdPerUnit), converted = rate.times(amount);
  if (!Number.isFinite(converted.toNumber()) || !Number.isFinite(rate.toNumber()) || rate.toNumber() === 0 || (amount > 0 && converted.toNumber() === 0)) throw Error('The converted value exceeds the supported numeric range.');
  return {rate: rate.toNumber(), converted: converted.toNumber(), from: a, to: b};
}
export function parseSiiUf(html: string, date: string): string {
  if (html.length > 1500000 || !validObservation(date, Date.parse(date))) throw Error('Invalid UF observation request.');
  const [year, month, day] = date.split('-').map(Number), months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  if (!new RegExp(`UF\\s+${year}`).test(html)) throw Error('The UF source year does not match.');
  const section = html.match(new RegExp(`id=['"]mes_${months[month-1]}['"][\\s\\S]*?</table>`))?.[0];
  if (!section) throw Error('The requested UF month is unavailable.');
  for (const cell of section.matchAll(/<th\b[^>]*>\s*(?:<strong>)?(\d{1,2})(?:<\/strong>)?\s*<\/th>\s*<td\b[^>]*>([^<]*)<\/td>/g)) {
    if (Number(cell[1]) !== day) continue;
    const value = cell[2].trim();
    if (!/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(value)) throw Error('The official UF value for this day has not been published.');
    const normalized = value.replaceAll('.', '').replace(',', '.');
    if (Number(normalized) <= 0) throw Error('The official UF value must be positive.');
    return normalized;
  }
  throw Error('The requested UF day is unavailable.');
}
