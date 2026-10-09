import {describe,it,expect} from 'vitest';
import {run} from '@/lib/calculators/everyday-engine';
describe('Declared apparel measurement methods',()=>{
  const size=(under:string,bust:string,unit='in')=>run('bra-legacy',{under,bust,measurementUnit:unit}).metrics;
  for(const [under,bust,expected]of [['30','36','34B'],['29','35','34A'],['30.4','35.6','34B']])it(`Triumph published +4/+5 example ${under}/${bust}`,()=>{expect(size(under,bust)[0].value).toBe(expected);});
  it('preserves the half-inch convention across exact metric conversion',()=>{expect(size('74.93','91.44','cm')).toEqual(size('29.5','36'));});
  it('rejects a negative rounded bust-minus-band difference',()=>{expect(()=>size('34','36')).toThrow(/outside/);});
  it('keeps the direct-band estimate distinct',()=>{expect(run('bra',{under:'32',bust:'36'}).metrics[0].value).toBe('32D');expect(size('32','36')[0].value).toBe('36AA');});
  for(const [unit,length]of [['cm','25.4'],['mm','254'],['in','10']])it(`normalizes adult foot length from ${unit}`,()=>{const r=run('shoe',{length,measurementUnit:unit,system:'men'});expect(r.metrics[0].value).toBeCloseTo(254,10);expect(r.metrics[1].value).toBe(8);});
});
