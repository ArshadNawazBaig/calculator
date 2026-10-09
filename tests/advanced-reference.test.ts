import {describe,it,expect} from 'vitest';
import finance from '../docs/research/finance-health/advanced-executable-cases.json';
import everyday from '../docs/research/everyday/executable-cases.json';
import {definitionMap} from '@/lib/calculators/registry';
import {calculate} from '@/lib/calculators/engine';
import {defaults,type Values} from '@/lib/calculators/types';
import type {CategoryId} from '@/lib/site';
type FinanceCase={id:string;slug:string;mode:string;category:CategoryId;inputs:Values;expectedErrorContains?:string|null;expected:{kind:string;label?:string;row?:number;column?:number;expected:number|string;tolerance:number}[]};
type Property={type:string;count?:number;length?:number;requiredPatterns?:string[];forbiddenPattern?:string;minimum?:number;maximum?:number;metricLabel?:string;integer?:boolean;alternateInputs?:Values};
type EverydayCase={id:string;slug:string;modeId:string;inputs:Values;expectedError?:boolean;expectations:{metricLabel:string;expected:string|number;absoluteTolerance:number;relativeTolerance:number}[];properties?:Property[]};

const compare=(actual:unknown,expected:unknown,absolute=1e-8,relative=1e-10)=>{
  expect(actual).toBeDefined();
  if(typeof expected==='number'){
    expect(typeof actual).toBe('number');
    expect(Math.abs(Number(actual)-expected)).toBeLessThanOrEqual(Math.max(absolute,relative*Math.abs(expected)));
  }else expect(actual).toBe(expected);
};

describe('Additional independent financial and health cases',()=>{
  for(const row of finance.cases as unknown as FinanceCase[])it(row.id,async()=>{
    const mode=definitionMap.get(row.slug)!.modes.find(m=>m.id===row.mode)!;
    const pending=calculate(row.category as CategoryId,mode,{...defaults(mode),...row.inputs});
    if(row.expectedErrorContains){await expect(pending).rejects.toThrow(row.expectedErrorContains);return;}
    const output=await pending;
    for(const e of row.expected){
      const actual=e.kind==='metric'?output.metrics.find(m=>m.label===e.label)?.value:output.table?.rows[e.row!]?.[e.column!];
      compare(actual,e.expected,e.tolerance);
    }
  });
});

describe('Independent everyday algorithm cases',()=>{
  for(const row of everyday.referenceCases as unknown as EverydayCase[])it(row.id,async()=>{
    const mode=definitionMap.get(row.slug)!.modes.find(m=>m.id===row.modeId)!;
    const run=(values:Values)=>calculate('everyday',mode,{...defaults(mode),...values});
    const pending=run(row.inputs as Values);
    if(row.expectedError){await expect(pending).rejects.toThrow();return;}
    const output=await pending;
    for(const e of row.expectations)compare(output.metrics.find(m=>m.label===e.metricLabel)?.value,e.expected,e.absoluteTolerance,e.relativeTolerance);
    for(const p of row.properties||[]){
      if(p.type==='passwords'){
        expect(output.table!.rows).toHaveLength(p.count!);
        for(const row of output.table!.rows){const value=String(row[0]);expect(value).toHaveLength(p.length!);for(const pattern of p.requiredPatterns!)expect(value).toMatch(new RegExp(pattern));expect(value).not.toMatch(new RegExp(p.forbiddenPattern!));}
      }else if(p.type==='dice'){
        const dice=String(output.metrics.find(m=>m.label==='Dice')!.value).split(',').map(Number);
        expect(dice).toHaveLength(p.count!);for(const value of dice){expect(Number.isInteger(value)).toBe(true);expect(value).toBeGreaterThanOrEqual(p.minimum!);expect(value).toBeLessThanOrEqual(p.maximum!);}
        expect(output.metrics.find(m=>m.label==='Total')!.value).toBe(dice.reduce((a,b)=>a+b,0));
      }else if(p.type==='metric-range'){
        const value=Number(output.metrics.find(m=>m.label===p.metricLabel)!.value);expect(value).toBeGreaterThanOrEqual(p.minimum!);expect(value).toBeLessThanOrEqual(p.maximum!);if(p.integer)expect(Number.isInteger(value)).toBe(true);
      }else if(p.type==='same-metric'){
        const second=await run({...row.inputs,...p.alternateInputs} as Values);expect(second.metrics.find(m=>m.label===p.metricLabel)?.value).toBe(output.metrics.find(m=>m.label===p.metricLabel)?.value);
      }else if(p.type==='day-offset-label')expect(output.metrics.find(m=>m.label===p.metricLabel)?.value).toBe('2 days earlier');
      else throw Error(`Unrecognized fixture property ${p.type}`);
    }
  });
});

describe('Pregnancy reference context',()=>{
  async function run(values:Values){const mode=definitionMap.get('pregnancy-weight-gain-calculator')!.modes[0];return calculate('health',mode,{...defaults(mode),...values});}
  it('separates cumulative gain, full-term range and later-trimester rate',async()=>{
    const out=await run({preweight:'60',current:'67',height:'165',week:'24',fetuses:'1'});
    compare(out.metrics.find(m=>m.label==='Pre-pregnancy BMI')!.value,22.03856749311295);
    expect(out.metrics.find(m=>m.label==='Current cumulative gain')!.value).toBe(7);
    expect(out.metrics.find(m=>m.label==='Total reference gain')!.value).toBe('11.5–16 kg');
    expect(out.metrics.find(m=>m.label==='Second/third-trimester reference rate')!.value).toBe('0.35–0.5 kg/week');
  });
  it('preserves negative measured gain and first-trimester context',async()=>{
    const out=await run({preweight:'60',current:'59',height:'165',week:'10'});
    expect(out.metrics.find(m=>m.label==='Current cumulative gain')!.value).toBe(-1);
    expect(out.metrics.find(m=>m.label==='First-trimester context')!.value).toBe('0.5–2 kg');
  });
  it('uses twin totals without fabricating weekly rates',async()=>{
    const out=await run({preweight:'60',current:'67',height:'165',week:'24',fetuses:'2'});
    expect(out.metrics.find(m=>m.label==='Total reference gain')!.value).toBe('17–25 kg');
    expect(out.metrics.find(m=>m.label==='Weekly reference')!.value).toBe('No universal weekly twin range');
  });
});
