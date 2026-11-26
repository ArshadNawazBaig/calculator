import {expect,it,describe} from 'vitest';
import data from './fixtures/finance-audit-reference.json';
import {definitions} from '@/lib/calculators/registry';
import {defaults,type Values} from '@/lib/calculators/types';
import {calculate} from '@/lib/calculators/engine';
import {compactDefaultExample, readCalculatorExample} from '@/lib/calculators/loan-schedule';
type Case={id:string;slug:string;algorithm:string;inputs:Record<string,unknown>;expected:Record<string,number|string>;absoluteTolerance:number};
describe('Independent financial edge-case audit',()=>{for(const c of data.cases as unknown as Case[])it(c.id,async()=>{
 const mode=definitions.find(d=>d.slug===c.slug)!.modes.find(m=>m.algorithm===c.algorithm)!,v:Values=defaults(mode);
 for(const [key,value]of Object.entries(c.inputs))v[key]=typeof value==='object'?JSON.stringify(value):typeof value==='boolean'?(value?'yes':'no'):String(value);
 const result=await calculate('finance',mode,v),metrics=Object.fromEntries(result.metrics.map(m=>[m.label,m.value]));
 for(const [label,expected]of Object.entries(c.expected)){const actual=metrics[label];expect(actual,label).toBeDefined();if(typeof expected==='number')expect(Math.abs(Number(actual)-expected),label).toBeLessThanOrEqual(c.absoluteTolerance);else expect(actual,label).toBe(expected);}
 });});

it.each(['mortgage-calculator', 'canadian-mortgage-calculator', 'mortgage-calculator-uk'])(
  '%s recreates every example payment after transfer', async slug => {
    const mode = definitions.find(definition => definition.slug === slug)!.modes[0];
    const result = await calculate('finance', mode, defaults(mode));
    const serialized = JSON.stringify(compactDefaultExample(mode, result));
    expect(serialized.length).toBeLessThan(JSON.stringify(result).length / 2);
    expect(readCalculatorExample(JSON.parse(serialized))).toEqual(result);
  }
);
