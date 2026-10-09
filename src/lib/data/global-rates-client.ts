import {validateGlobalRates, type GlobalRates} from './global-rates';
let cached: GlobalRates | undefined;
let cachedAt = 0;
export async function getGlobalRates(): Promise<GlobalRates> {
  if (cached && Date.now() - cachedAt < 300000) return {...validateGlobalRates(cached), cached: true};
  try {
    const response = await fetch('/api/global-rates', {signal: AbortSignal.timeout(20000)});
    if (!response.ok) throw Error('Reference source unavailable.');
    const data = validateGlobalRates(await response.json()); cached = data; cachedAt = Date.now(); return data;
  } catch {
    if (cached) {try {return {...validateGlobalRates(cached), cached: true};} catch {cached = undefined;}}
    throw Error('Global reference quotes could not load. Reconnect and retry, or use the manual-rate mode.');
  }
}
