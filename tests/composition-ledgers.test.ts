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
