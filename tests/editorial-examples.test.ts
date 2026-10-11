import {describe,expect,it} from 'vitest';
import {definitionMap,catalog} from '@/lib/calculators/registry';
import {calculate} from '@/lib/calculators/engine';
import {defaults,type Values} from '@/lib/calculators/types';

async function metrics(slug:string,id:string,inputs:Values) {
  const mode=definitionMap.get(slug)!.modes.find(mode=>mode.id===id)!;
  const result=await calculate(catalog.find(tool=>tool.slug===slug)!.category,mode,{...defaults(mode),...inputs});
  return Object.fromEntries(result.metrics.map(metric=>[metric.label,metric.value]));
}
describe('published editorial examples and regional assumptions',()=>{
  // Independently evaluated annuity formulas; see docs/growth-quality-2026-10-11.md.
  it.each([['end',2395.07533145183],['beginning',2407.75783446503]])('checks monthly deposits at period %s',async(timing,balance)=>{
    const result=await metrics('compound-interest-calculator','growth',{initial:'1000',contribution:'100',rate:'12',years:'1',frequency:'12',contributionFrequency:'12',timing:String(timing),taxRate:'0',inflation:'0'});
    expect(result['Projected balance']).toBeCloseTo(Number(balance),7);
    expect(result['Total contributions']).toBe(2200);
  });
  it('uses semiannual nominal compounding for a Canadian mortgage',async()=>{
    const result=await metrics('canadian-mortgage-calculator','repayment',{price:'300000',down:'0',rate:'5',years:'25',tax:'0',insurance:'0',pmi:'0',hoa:'0',other:'0',extra:'0',extraAnnual:'0',oneTime:'0'});
    expect(result['Regular monthly payment']).toBeCloseTo(1744.81495511105,7);
  });
  it('retains the principal in the UK interest-only example',async()=>{
    const result=await metrics('mortgage-calculator-uk','interest-only',{principal:'250000',rate:'5',years:'25'});
    expect(result['Monthly interest-only payment']).toBeCloseTo(1041.66666666667,7);
    expect(result['Principal due at term end']).toBe(250000);
    expect(result['Interest over the term']).toBe(312500);
  });
  it('undoes a 20% discount from the original base',async()=>{
    const result=await metrics('percent-calculator','reverse',{final:'80',change:'-20'});
    expect(result['Original value']).toBe(100);
  });
  it('clamps a month addition to the last day in leap-year February',async()=>{
    const result=await metrics('date-calculator','add',{start:'2024-01-31',years:'0',months:'1',weeks:'0',days:'0'});
    expect(result['Result date']).toBe('2024-02-29');
  });
  it('describes the second RMD deadline even when viewing a later distribution year',async()=>{
    const result=await metrics('rmd-calculator','calendar',{birthDate:'1948-01-01',distributionYear:'2023'});
    expect(result['First distribution year']).toBe(2018);
    expect(result['First RMD latest deadline']).toBe('2019-04-01');
    expect(result['Second RMD deadline']).toBe('2019-12-31');
    expect(result).not.toHaveProperty('Next RMD deadline');
  });
});
