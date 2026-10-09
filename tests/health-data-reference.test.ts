import {it,expect,describe} from 'vitest';
import data from '../docs/research/health/bmi-reference-cases.json';
import {definitionMap} from '@/lib/calculators/registry';
import {calculate} from '@/lib/calculators/engine';
import {defaults,type Values} from '@/lib/calculators/types';

async function run(slug:string,id:string,values:Values){const mode=definitionMap.get(slug)!.modes.find(m=>m.id===id)!;return calculate('health',mode,{...defaults(mode),...values});}
describe('Versioned CDC data and independently calculated percentiles',()=>{
  for(const row of data.cases)it(row.id,async()=>{
    const out=await run('bmi-calculator','child',row.inputs);
    expect(Number(out.metrics[0].value)).toBeCloseTo(row.expectedBmi,10);
    if(row.expectedPercentile>99.99)expect(out.metrics[1].value).toBe('Above 99.99');
    else expect(Number(out.metrics[1].value)).toBeCloseTo(row.expectedPercentile,9);
  });
  it('excludes adult and fractional completed-month ages',async()=>{
    await expect(run('bmi-calculator','child',{ageYears:'20'})).rejects.toThrow();
    await expect(run('bmi-calculator','child',{ageMonths:'6.5'})).rejects.toThrow();
  });
  it('preserves percentile under equivalent US measurements',async()=>{
    const metric=await run('bmi-calculator','child',{weight:'30',height:'135'});
    const us=await run('bmi-calculator','child',{units:'us',weight:'66.13867865546327',height:'53.1496062992126'});
    expect(Number(us.metrics[1].value)).toBeCloseTo(Number(metric.metrics[1].value),9);
  });
});

it('uses Mifflin maintenance energy for adult macro ranges',async()=>{
  const out=await run('macro-calculator','energy-ranges',{sex:'male',weight:'70',height:'175',age:'30',method:'mifflin',activity:'1.2',adjustment:'0'});
  expect(out.metrics[0].value).toBe(1978.5);
  expect(out.metrics.find(m=>m.label==='Protein energy reference')?.value).toBe('49.5–173.1');
});

it('compares Lombardi with the primary published equation at five reps',async()=>{
  const out=await run('one-rep-max-calculator','rep',{weight:'100',reps:'5',unit:'kg'});
  expect(Number(out.metrics.find(m=>m.label==='Lombardi estimate')?.value)).toBeCloseTo(117.4618943088019,10);
});

it('keeps generated Fibonacci values exact beyond JavaScript safe integers',async()=>{
  const mode=definitionMap.get('number-sequence-calculator')!.modes.find(m=>m.id==='sequence')!;
  const out=await calculate('math',mode,{...defaults(mode),kind:'fibonacci',count:'100'});
  expect(out.table?.rows[79][1]).toBe('14472334024676221');
  expect(out.table?.rows[99][1]).toBe('218922995834555169026');
});
