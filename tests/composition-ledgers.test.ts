import {describe,it,expect} from 'vitest';
import * as tax from '@/lib/calculators/tax-composition';
import * as program from '@/lib/calculators/program-composition';
import {runFixture as runTax} from './support/tax-composition-adapter.cjs';
import {runFixture as runProgram} from './support/program-composition-adapter.cjs';
import taxReferences from './fixtures/tax-composition-reference.json';
import taxEdges from './fixtures/tax-composition-edge.json';
import programReferences from './fixtures/program-composition-reference.json';
import programEdges from './fixtures/program-composition-edge.json';
type Case={id:string;input:Record<string,unknown>;expected?:unknown;expectedError?:boolean|string;expectedErrorContains?:string;absoluteTolerance?:number;assertion?:string;requestedMonth?:number};
function compare(actual:unknown,expected:unknown,tolerance:number){if(expected!==null&&typeof expected==='object'){expect(actual).not.toBeNull();for(const [key,value]of Object.entries(expected))compare((actual as Record<string,unknown>)[key],value,tolerance);}else if(typeof expected==='number'){expect(typeof actual).toBe('number');expect(Math.abs(Number(actual)-expected)).toBeLessThanOrEqual(tolerance);}else expect(actual).toEqual(expected);}
for(const [name,cases,runner,implementation]of [['tax',[...taxReferences.fixtures,...taxEdges.fixtures],runTax,tax],['program',[...programReferences.fixtures,...programEdges.fixtures],runProgram,program]] as const)describe(`${name} independently derived composition and boundary cases`,()=>{for(const c of cases as unknown as Case[])it(c.id,()=>{const invoke=()=>runner(c,implementation);if(c.expectedError){expect(invoke).toThrow(c.expectedErrorContains);return;}const actual=invoke();if(c.assertion==='noEarlierAnnualExtra'){for(const row of actual.tableRows||[])if(row[1]==='Annual')expect(row[0]).toBeGreaterThanOrEqual(c.requestedMonth!);return;}compare(actual,c.expected,c.absoluteTolerance??.02);});});


describe('VA worksheet defaults',()=>{
  it('keeps VA mortgage insurance at zero in current-policy and manual examples',async()=>{
    const {definitionMap}=await import('@/lib/calculators/registry');
    const {defaults}=await import('@/lib/calculators/types');
    const {calculate}=await import('@/lib/calculators/engine');
    const mode=definitionMap.get('va-mortgage-calculator')!.modes.find(mode=>mode.id==='ownership-comparison')!;
    for(const policySource of ['current','manual']){
      const output=await calculate('finance',mode,{...defaults(mode),policySource});
      expect(output.metrics.find(metric=>metric.label==='Monthly-plan total MIP')?.value).toBe(0);
      expect(output.metrics.find(metric=>metric.label==='Accelerated total MIP')?.value).toBe(0);
      expect(output.metrics.find(metric=>metric.label==='Upfront program fee')?.value).toBeCloseTo(6450,8);
      expect(output.notes?.join(' ')).not.toContain('FHA premiums');
    }
  });
});
