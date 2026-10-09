import {sharedSnapshot} from '@/lib/data/snapshot-cache';
import {FRANKFURTER_RATES, parseFrankfurterRows, applyInverseQuote, validateGlobalRates, parseSiiUf, type GlobalRates} from '@/lib/data/global-rates';
import instruments from '@/data/currency-instruments.json';
import Decimal from 'decimal.js';
async function json(url: string, seconds = 3600): Promise<unknown> {
  const response = await fetch(url, {next: {revalidate: seconds}, signal: AbortSignal.timeout(8000)});
  if (!response.ok) throw Error('Reference source unavailable.');
  const text = await response.text(); if (text.length > 1500000) throw Error('Reference response too large.');
  return JSON.parse(text);
}
async function loadSnapshot() {
  try {
    const now = new Date();
    const date = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit'}).format(now);
    const auxiliary = Promise.allSettled([
      json('https://api.coinbase.com/v2/prices/BTC-USD/spot', 60),
      (async () => {
        const response = await fetch(`https://www.sii.cl/valores_y_fechas/uf/uf${date.slice(0, 4)}.htm`, {next: {revalidate: 3600}, signal: AbortSignal.timeout(8000)});
        if (!response.ok) throw Error('UF unavailable.');
        return parseSiiUf(await response.text(), date);
      })(),
    ]);
    const rows = parseFrankfurterRows(await json(FRANKFURTER_RATES), now.getTime());
    const data: GlobalRates = {retrievedAt: now.toISOString(), quotes: {USD: {code: 'USD', usdPerUnit: '1', date: now.toISOString().slice(0, 10), kind: 'daily-reference', source: 'USD reference identity', contributors: [], pegDerived: false}}, missing: []};
    for (const quote of rows) if (quote.code !== 'USD') data.quotes[quote.code] = quote;
    const inverse = rows.filter(q => Number(q.usdPerUnit) > 1);
    await Promise.all(inverse.map(async quote => {
      try {data.quotes[quote.code] = applyInverseQuote(quote, await json(`https://api.frankfurter.dev/v2/rate/${quote.code.toLowerCase()}/usd?expand=providers`), now.getTime());}
      catch {delete data.quotes[quote.code];}
    }));
    const [btc, uf] = await auxiliary;
    try {
      if (btc.status !== 'fulfilled') throw Error('Spot unavailable.');
      const raw = btc.value as {data?: {base?: string; currency?: string; amount?: string}};
      const price = raw.data;
      if (price?.base === 'BTC' && price.currency === 'USD' && typeof price.amount === 'string' && /^\d+(?:\.\d+)?$/.test(price.amount) && Number(price.amount) > 0 && Number.isFinite(Number(price.amount))) data.quotes.BTC = {code: 'BTC', usdPerUnit: price.amount, date: now.toISOString().slice(0, 10), kind: 'spot', source: 'Coinbase public BTC/USD spot; timestamp is retrieval time', contributors: [], pegDerived: false};
    } catch {/* Other daily reference pairs remain available. */}
    try {
      if (uf.status !== 'fulfilled' || !data.quotes.CLP) throw Error('UF or CLP unavailable.');
      const clf = uf.value as string, clp = data.quotes.CLP;
      data.quotes.CLF = {code: 'CLF', usdPerUnit: new Decimal(clf).times(clp.usdPerUnit).toString(), date, kind: 'daily-reference', source: `SII: ${clf} CLP per UF on ${date}; CLP cross observed ${clp.date}`, contributors: clp.contributors, pegDerived: false};
    } catch {/* Unpublished UF dates remain unavailable; no previous day is silently substituted. */}
    data.missing = instruments.filter(i => !data.quotes[i.code]).map(i => i.code);
    return Response.json(validateGlobalRates(data), {headers: {'Cache-Control': 'public, max-age=60, s-maxage=60', 'X-Robots-Tag': 'noindex'}});
  } catch {
    return Response.json({error: 'Global quotes are temporarily unavailable. Use a dated manual rate or try again.'}, {status: 503, headers: {'Cache-Control': 'no-store', 'Retry-After': '60', 'X-Robots-Tag': 'noindex'}});
  }
}

export async function GET(){return sharedSnapshot('global-rates',60,loadSnapshot);}
