import instruments from '@/data/currency-instruments.json';
import {getGlobalRates} from '@/lib/data/global-rates-client';
import {globalConversion} from '@/lib/data/global-rates';
import {num} from './helpers';
import {metric as m, type Values, type Result} from './types';
export async function runGlobalCurrency(v: Values): Promise<Result> {
  if (v.from === v.to) return {metrics: [m('Converted amount', num(v, 'amount'), 'number', v.to), m('Reference cross rate', 1, 'number', `${v.to} per ${v.from}`)], notes: ['An instrument converted to itself has a rate of 1. No quote request is needed; this identity does not establish a current market value or convertibility.']};
  const data = await getGlobalRates(), result = globalConversion(num(v, 'amount'), v.from, v.to, data);
  const attribution = (which: string, quote: typeof result.from) => `${which}: ${quote.source}. ${quote.kind === 'spot' ? 'Spot snapshot; retrieval time shown separately' : 'Observed ' + quote.date}.${quote.pegDerived ? ' Provider identifies a peg-derived reference.' : ''}`;
  let table: Result['table'];
  if (v.tableView === 'matrix') {
    const codes = ['USD','EUR','GBP','CAD','AUD','JPY','CHF','CNY'].filter(code => data.quotes[code]);
    table = {headers: ['1 unit of', ...codes], rows: codes.map(code => [code, ...codes.map(to => globalConversion(1, code, to, data).rate.toPrecision(10))])};
  } else if (v.tableView === 'providers') {
    table = {headers: ['Instrument', 'Provider', 'Provider observation', 'Quote used in blend'], rows: [result.from,result.to].flatMap(q => q.contributors.map(p => [q.code,p.key,p.date || 'Not supplied',p.excluded ? 'Excluded' : 'Included']))};
  } else table = {headers: [`1 ${v.from} buys`, 'Instrument', 'Reference / retrieval date', 'Quote type'], rows: instruments.filter(i => data.quotes[i.code] && (v.currencyList !== 'popular' || i.popular)).map(i => [globalConversion(1, v.from, i.code, data).rate.toPrecision(10), i.label, data.quotes[i.code].date, data.quotes[i.code].kind])};
  return {metrics: [{...m('Converted amount', result.converted, 'number', v.to), digits: 10}, {...m('Reference cross rate', result.rate, 'number', `${v.to} per ${v.from}`), digits: 12}, m('Source quote date', result.from.date), m('Target quote date', result.to.date), m('Snapshot retrieved (UTC)', data.retrievedAt)], table, notes: [attribution(v.from,result.from), attribution(v.to,result.to), 'Reference observations can have different dates. Blended contributors may be older than the displayed blend date; the provider table preserves their dates and exclusions. References, precious metals and Bitcoin spot prices are not executable transaction quotes.', 'Finflo converts locally through a USD reference, retaining higher-precision inverse quotes for instruments worth more than one USD. Provider rounding, spreads, fees and convertibility restrictions can affect actual transactions.', `${data.cached ? 'Using a previously retrieved browser snapshot. ' : ''}Generic source snapshots are requested without your amount or currency selections. Six legacy codes require an explicitly dated manual rate; missing individual quotes do not create substitute rates.`]};
}
