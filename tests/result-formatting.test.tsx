import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {number,money} from '@/lib/format';
import {formatMetric} from '@/lib/calculators/format-metric';
import {finalGrade} from '@/lib/calculators/final-grade';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap,toolMap} from '@/lib/calculators/registry';
import {defaults,numericTextMetric,type Values} from '@/lib/calculators/types';
import {CalculatorResult} from '@/components/calculators/result';
import {ResultTable} from '@/components/calculators/result-table';
import {getContentDictionary} from '@/lib/i18n/content';
import {languages,locales,translator} from '@/lib/i18n/config';

async function run(slug:string,algorithm:string,values:Values={}) {
 const mode=definitionMap.get(slug)!.modes.find(mode=>mode.algorithm===algorithm)!;
 return calculate(toolMap.get(slug)!.category,mode,{...defaults(mode),...values});
}

describe('calculator display precision',()=>{
 it('rounds ordinary results, percentages and explicit legacy precision to at most two places',()=>{
  expect(number(1.005)).toBe('1.01');
  expect(formatMetric({label:'Required score',value:101+2/3,format:'percent'})).toBe('101.67%');
  expect(formatMetric({label:'Rate',value:1.23456789,digits:12})).toBe('1.23');
  expect(number(-0)).toBe('0');
  expect(money(-.0001)).toBe('$0.00');
 });
 it('retains small nonzero quantities and huge values in compact scientific notation',()=>{
  expect(number(0.0000000123456)).toBe('1.23E-8');
  expect(number(-0.0000000123456)).toBe('-1.23E-8');
  expect(number(1.23456789e100)).toBe('1.23E100');
  expect(formatMetric(numericTextMetric('Quantity','1.23456e1000','GB'))).toBe('1.23E1000 GB');
  expect(formatMetric(numericTextMetric('Quantity','1.23456e-1000','GB'))).toBe('1.23E-1000 GB');
 });
 it('respects localized separators, including Arabic digits, and caps currency displays',()=>{
  expect(number(1234.567,undefined,'de')).toBe('1.234,57');
  expect(number(1234.567,undefined,'ar')).toBe('١٬٢٣٤٫٥٧');
  expect(money(12.345,'KWD')).toContain('12.35');
  expect(money(12.345,'JPY')).toBe('¥12');
 });
 it('formats only opted-in composite answers and retains operators and units',()=>{
  expect(formatMetric(numericTextMetric('Roots','0.333333+0.666667i'))).toBe('0.33+0.67i');
  expect(formatMetric(numericTextMetric('Coordinates','(1.23456, -2.34567)'))).toBe('(1.23, -2.35)');
  expect(formatMetric(numericTextMetric('Data','1.048576','MB'))).toBe('1.05 MB');
  for(const value of ['192.168.1.255','2026-10-10T00:00:00.000Z','123456789012345678901234567890','0.123456789 user content']) {
   expect(formatMetric({label:'Result',value})).toBe(value);
  }
 });
 it('uses two places in detailed tables without mutating stored numbers or user strings',()=>{
  const table={headers:['Value','Amount ($)','User text'],rows:[[1/3,1234.567,'0.123456789']]};
  const html=renderToStaticMarkup(<ResultTable table={table} currency="KWD" currencyLabels moneyColumns={[1]}/>);
  expect(html).toContain('>0.33</td>');expect(html).toContain('>1,234.57</td>');
  expect(html).toContain('>0.123456789</td>');expect(table.rows[0][0]).toBe(1/3);
 });
 it('keeps mathematical percentages above 100 and legitimate negative changes',async()=>{
  const result=await run('percent-calculator','percent-change',{from:'20',to:'70'});
  expect(formatMetric(result.metrics[0])).toBe('250%');
  expect(formatMetric({label:'Change',value:-150,format:'percent'})).toBe('-150%');
 });
 it('keeps user-requested exact precision in dedicated rounding and big-number modes',async()=>{
  const result=await run('big-number-calculator','decimal-arithmetic',{a:'1',b:'3',operation:'/',places:'8'});
  expect(formatMetric(result.metrics[0])).toBe('0.33333333');
 });
 it('rounds fraction approximations, complex roots, slope equations, matrices and data conversions',async()=>{
  for(const [slug,algorithm,values] of [
   ['fraction-calculator','fraction-simplify',{a:'1/3'}],
   ['quadratic-formula-calculator','quadratic',{a:'3',b:'1',c:'1'}],
   ['slope-calculator','slope',{x1:'0',y1:'0',x2:'3',y2:'1'}],
   ['matrix-calculator','matrix',{a:'3,0\n0,7',operation:'inverse'}],
   ['bandwidth-calculator','data-units',{}],
   ['bandwidth-calculator','website-units',{}],
  ] as [string,string,Values][]) {
   const result=await run(slug,algorithm,values);
   for(const metric of result.metrics)expect(formatMetric(metric),`${slug}: ${metric.label}`).not.toMatch(/\.\d{3}/);
  }
 });
});

describe('bounded grade targets and probabilities',()=>{
 it('explains the screenshot case without presenting an impossible score as attainable',async()=>{
  const result=await run('grade-calculator','final-grade',{current:'85',target:'90',weight:'30'});
  expect(result.metrics[0].value).toBeCloseTo(101.6666666667,8);
  expect(formatMetric(result.metrics[0])).toBe('Target not attainable');
  expect(result.metrics.find(m=>m.label==='Highest possible overall grade')?.value).toBe(89.5);
  expect(result.notes?.join(' ')).toContain('more than 100%');
  const html=renderToStaticMarkup(<CalculatorResult result={result}/>);
  expect(html).not.toContain('101.67%');expect(html).toContain('89.5%');
  expect(html).toContain('data-text="true"');
 });
 it('applies the same rule to letter inputs',async()=>{
  const result=await run('grade-calculator','grade-letter-final',{current:'B',target:'A',remainingWeight:'20'});
  expect(result.metrics[0].value).toBe(135);
  expect(formatMetric(result.metrics[0])).toBe('Target not attainable');
  expect(formatMetric(result.metrics[1])).toBe('88%');
 });
 it('distinguishes exact boundaries, already-secured targets and barely impossible targets',()=>{
  expect(formatMetric(finalGrade(85,91,40,'Score').metrics[0])).toBe('100%');
  expect(formatMetric(finalGrade(80,88,50,'Score').metrics[0])).toBe('96%');
  const secured=finalGrade(95,60,20,'Score');
  expect(formatMetric(secured.metrics[0])).toBe('Target already secured');
  expect(formatMetric(secured.metrics[1])).toBe('0%');
  expect(formatMetric(finalGrade(80,90.00001,50,'Score').metrics[0])).toBe('Target not attainable');
  expect(formatMetric(finalGrade(100,0,100,'Score').metrics[0])).toBe('0%');
 });
 it('translates new result statuses in every supported language',async()=>{
  const dictionaries=await Promise.all(locales.filter(c=>c!=='en').map(async c=>({locale:c,messages:await getContentDictionary(c)})));
  const metric=finalGrade(85,90,30,'Required final score').metrics[0];
  for(const {locale,messages} of dictionaries) {
   expect(formatMetric(metric,'USD',languages[locale].tag,translator(messages)),locale).not.toBe('Target not attainable');
  }
 });
 it('removes floating-point leakage outside the probability bounds',async()=>{
  const result=await run('probability-calculator','probability',{a:'.9',b:'.2',relation:'dependent',intersection:'.1'});
  for(const metric of result.metrics) {expect(Number(metric.value)).toBeGreaterThanOrEqual(0);expect(Number(metric.value)).toBeLessThanOrEqual(1);}
  expect(result.metrics.find(m=>m.label==='P(neither)')?.value).toBe(0);
 });
});
