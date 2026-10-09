import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
import {parseEcbFeed,referenceConversion} from '@/lib/data/reference-rates';
const raw=readFileSync('docs/research/finance-health/ecb-reference-2026-10-08.xml','utf8');
const date=new Date('2026-10-09T12:00:00Z');
it('parses the official XML fixture and derives a USD-to-GBP cross rate',()=>{
  const data=parseEcbFeed(raw,date);
  expect(data.date).toBe('2026-10-08');
  expect(data.rates.USD).toBe(1.1186);
  const value=referenceConversion(100,'USD','GBP',data);
  expect(value.converted).toBeCloseTo(75.7178616127302,10);
  expect(referenceConversion(100,'USD','USD',data).converted).toBe(100);
});
it('rejects stale, incomplete, duplicate, nonfinite, and unavailable data',()=>{
  expect(()=>parseEcbFeed(raw,new Date('2026-11-01'))).toThrow(/freshness/);
  expect(()=>parseEcbFeed(raw.replace("currency='USD' rate='1.1186'", "currency='EUR' rate='1.1186'"),date)).toThrow();
  expect(()=>parseEcbFeed(raw.replace("rate='1.1186'", "rate='0'"),date)).toThrow();
  const data=parseEcbFeed(raw,date);
  expect(()=>referenceConversion(100,'RUB','USD',data)).toThrow(/unavailable/);
  expect(()=>referenceConversion(Infinity,'USD','EUR',data)).toThrow();
});
