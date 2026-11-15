import {describe, expect, it} from 'vitest';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults, type Values} from '@/lib/calculators/types';

const definition=definitionMap.get('area-calculator')!;
async function run(id:string,inputs:Values={}){
  const mode=definition.modes.find(item=>item.id===id)!;
  return calculate('math',mode,{...defaults(mode),...inputs});
}

describe('area measurements and land units',()=>{
  it('keeps the existing rectangle default and supports a square from one side',async()=>{
    expect(definition.modes[0].id).toBe('rectangle');
    const result=await run('square',{a:'12',aUnit:'in',outputUnit:'ft'});
    expect(result.metrics[0]).toMatchObject({label:'Area',unit:'ft²'});
    expect(result.metrics[0].value).toBeCloseTo(1,12);
    expect(result.explanation).toContain('A = 1² = 1 ft².');
  });

  it('uses the international acre and hectare definitions',async()=>{
    const acre=await run('rectangle',{a:'66',aUnit:'ft',b:'660',bUnit:'ft',outputUnit:'ac'});
    expect(acre.metrics[0].value).toBeCloseTo(1,12);
    expect(acre.metrics[0].unit).toBe('ac');
    expect(acre.explanation).toContain('m² ÷ 4046.8564224 = 1 ac.');
    const hectare=await run('rectangle',{a:'100',b:'100',outputUnit:'ha'});
    expect(hectare.metrics[0]).toMatchObject({value:1,unit:'ha'});
  });

  it('checks the published land-area examples',async()=>{
    const lot=await run('rectangle',{a:'150',aUnit:'ft',b:'200',bUnit:'ft',outputUnit:'ac'});
    expect(lot.metrics[0].value).toBeCloseTo(30000/43560,12);
    const field=await run('rectangle',{a:'120',b:'80',outputUnit:'ha'});
    expect(field.metrics[0].value).toBe(0.96);
  });

  it('supports square kilometers and square miles without changing saved unit IDs',async()=>{
    const kilometers=await run('square',{a:'1000',outputUnit:'km'});
    expect(kilometers.metrics[0]).toMatchObject({value:1,unit:'km²'});
    const miles=await run('rectangle',{a:'5280',aUnit:'ft',b:'5280',bUnit:'ft',outputUnit:'mi'});
    expect(miles.metrics[0].value).toBeCloseTo(1,12);
    expect(miles.metrics[0].unit).toBe('mi²');
  });

  it('normalizes three triangle sides before calculating acreage and labels lengths separately',async()=>{
    const triangle=await run('triangle-sss',{a:'3',aUnit:'ft',b:'48',bUnit:'in',c:'5',cUnit:'ft',outputUnit:'ac'});
    expect(triangle.metrics[0].value).toBeCloseTo(6/43560,14);
    expect(triangle.metrics[0].unit).toBe('ac');
    expect(triangle.metrics.find(metric=>metric.label==='Perimeter')).toMatchObject({unit:'m'});
    expect(triangle.explanation).toContain('s = (0.9144 + 1.2192 + 1.524) ÷ 2 = 1.8288 m.');
  });

  it.each(definition.modes.map(mode=>mode.id))('provides worked substitution for %s',async id=>{
    const result=await run(id);
    expect(result.explanation).toContain('A =');
    expect(result.explanation).toContain('m²');
    expect(result.explanation).not.toContain('square units');
  });

  it('accepts a full-circle sector in degrees or radians',async()=>{
    const degrees=await run('sector',{r:'2',angle:'360'});
    const radians=await run('sector',{r:'2',angle:'2*pi',angleUnit:'rad'});
    expect(degrees.metrics[0].value).toBeCloseTo(4*Math.PI,12);
    expect(radians.metrics[0].value).toBeCloseTo(4*Math.PI,12);
  });

  it.each([
    ['sector',{angle:'361'}],
    ['sector',{angle:'3*pi',angleUnit:'rad'}],
    ['sector',{angle:'0'}],
    ['sector',{angle:'-pi',angleUnit:'rad'}],
    ['square',{a:'0'}],
    ['square',{a:'-2'}],
    ['square',{a:'Infinity'}],
    ['square',{a:'1e200'}],
    ['square',{a:'1e-200'}],
    ['square',{a:'1e-161',outputUnit:'ha'}],
    ['rectangle',{a:'3',outputUnit:'unknown'}],
    ['triangle-sss',{a:'1',b:'2',c:'3'}],
    ['triangle-sss',{a:'1',aUnit:'ft',b:'12',bUnit:'in',c:'1',cUnit:'m'}],
  ] satisfies [string,Values][])('rejects invalid %s dimensions %j',async(id,values)=>{
    await expect(run(id,values)).rejects.toThrow();
  });

  it('keeps land units unavailable for volume calculations',async()=>{
    const cube=definitionMap.get('volume-calculator')!.modes.find(mode=>mode.id==='cube')!;
    await expect(calculate('math',cube,{...defaults(cube),outputUnit:'ac'})).rejects.toThrow();
  });
});
