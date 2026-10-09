import {describe,it,expect} from 'vitest';
import pairs from './fixtures/probability-pairs.json';
import {probabilitySolver,probabilitySeries,normalInterval} from '@/lib/calculators/probability-extended';
import {exactRandom,randomBelow} from '@/lib/calculators/random-exact';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults,type Values} from '@/lib/calculators/types';
import {triangleMeasures} from '@/lib/calculators/triangle-measures';
type Pair={id:string;known:Record<string,string>;expected_state:string;solutions:{A:string;B:string}[]};
describe('All pairs of independent-event constraints',()=>{
  for(const f of pairs as unknown as Pair[])it(f.id,()=>{
    const [[known1,value1],[known2,value2]]=Object.entries(f.known);
    const run=()=>probabilitySolver({known1,value1,known2,value2});
    if(f.expected_state==='inconsistent'||f.expected_state==='invalid'){expect(run).toThrow();return;}
    const out=run();
    if(f.expected_state==='underdetermined'){expect(out.metrics[0].value).toContain('do not determine');return;}
    expect(out.table?.rows).toHaveLength(f.solutions.length);
    for(const expected of f.solutions){expect(out.table?.rows.some(row=>Math.abs(Number(row[1])-Number(expected.A))<=1e-12*Math.max(Number(expected.A),1e-300)&&Math.abs(Number(row[2])-Number(expected.B))<=1e-12*Math.max(Number(expected.B),1e-300))).toBe(true);}
  });
});
it('keeps small repeated-event probabilities',()=>{
  const out=probabilitySeries({pA:'1e-20',nA:'1000000',pB:'.2',nB:'3'});
  expect(Math.abs(Number(out.metrics[2].value)/9.99999999999995e-15-1)).toBeLessThan(1e-12);
});
it('supports infinite bounds and accurate extreme normal tails',()=>{
  expect(normalInterval({mean:'0',sd:'1',lower:'-inf',upper:'inf'}).metrics[0].value).toBe(1);
  expect(Math.abs(Number(normalInterval({mean:'0',sd:'1',lower:'9',upper:'inf'}).metrics[0].value)/1.1285884059538406e-19-1)).toBeLessThan(1e-12);
});
it('rejects biased out-of-range byte samples before accepting',()=>{
  const bytes=[3,2];expect(randomBelow(3n,out=>out.fill(bytes.shift()!))).toBe(2n);expect(bytes).toHaveLength(0);
  const out=exactRandom({min:'1000000000000000000000000000000',max:'1000000000000000000000000000002',count:'1',kind:'integer',replacement:'yes',sort:'none'},bytes=>bytes.fill(2));
  expect(out.metrics[0].value).toBe('1000000000000000000000000000002');
});
it('samples the complete decimal grid without rejection loops or lexical sorting',()=>{
  const out=exactRandom({min:'-.025',max:'.025',places:'2',count:'5',kind:'decimal',replacement:'no',sort:'ascending'},bytes=>bytes.fill(0));
  expect(out.metrics[0].value).toBe('-0.02, -0.01, 0.00, 0.01, 0.02');
});
async function run(slug:string,id:string,values:Values){const mode=definitionMap.get(slug)!.modes.find(m=>m.id===id)!;return calculate('math',mode,{...defaults(mode),...values});}
it('normalizes mixed dimension units with dimensional result labels',async()=>{
  const out=await run('area-calculator','rectangle',{a:'12',aUnit:'in',b:'1',bUnit:'ft',outputUnit:'ft'});
  expect(out.metrics[0].value).toBeCloseTo(1,12);expect(out.metrics[0].unit).toBe('ft²');
  const cube=await run('volume-calculator','cube',{a:'100',aUnit:'cm',outputUnit:'m'});
  expect(cube.metrics[0].value).toBe(1);expect(cube.metrics[0].unit).toBe('m³');
});
it('converts pi-based radian angles without evaluating arbitrary expressions',async()=>{
  const out=await run('area-calculator','sector',{r:'2',angle:'pi/2',angleUnit:'rad'});
  expect(Number(out.metrics[0].value)).toBeCloseTo(Math.PI,12);
  await expect(run('area-calculator','sector',{angle:'globalThis.x=1'})).rejects.toThrow();
  expect(Number((await run('log-calculator','log',{value:'e',base:'e'})).metrics[0].value)).toBe(1);
  expect((await run('scientific-notation-calculator','notation',{value:'-1.25 × 10^-3'})).metrics[1].value).toBe('-0.00125');
});
it('calculates canonical centers and radii of a 3-4-5 triangle',()=>{
  const out=triangleMeasures(3,4,5,6),value=(label:string)=>out.find(m=>m.label===label)!.value;
  expect(value('Inradius')).toBeCloseTo(1,12);expect(value('Circumradius')).toBeCloseTo(2.5,12);
  expect(value('Vertex C')).toBe('(3.2, 2.4)');expect(value('Centroid')).toBe('(2.73333333333, 0.8)');
  expect(value('Incenter')).toBe('(3, 1)');expect(value('Circumcenter')).toBe('(2.5, 0)');
});
