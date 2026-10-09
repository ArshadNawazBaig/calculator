import {describe,expect,it} from 'vitest';
import {run} from '@/lib/calculators/everyday-engine';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults,type Result} from '@/lib/calculators/types';
// Independent reference rules/examples:
// https://www.usga.org/content/usga/home-page/handicapping/roh/Content/rules/5%201c%20Calculation%20of%20a%20Score%20DifferentialRoundingMinus.htm
// https://www.scga.org/images/uploads/pdfs/jobs/USGA_Handicap_Committee_Guide_2023.pdf (pages 20–21)
const round=(score:number,rating=72,slope=113,pcc=0)=>({score,rating,slope,pcc});
const calc=(rows:Record<string,unknown>[])=>run('golf-rounds',{rounds:JSON.stringify(rows)});
const metric=(r:Result,label:string)=>r.metrics.find(m=>m.label===label)?.value;
describe('Independent recent 18-hole round composition',()=>{
 it('converts three round scores into the lowest differential minus 2',()=>{
  const r=calc([round(82),round(84),round(86)]);expect(r.table?.rows.map(row=>row[5])).toEqual([10,12,14]);expect(metric(r,'Estimated handicap index')).toBe(8);
 });
 it('selects the lowest eight of twenty differentials before averaging',()=>{
  const r=calc(Array.from({length:20},(_,i)=>round(92-i)));expect(metric(r,'Estimated handicap index')).toBe(4.5);expect(metric(r,'Differentials used')).toBe('1, 2, 3, 4, 5, 6, 7, 8');
 });
 it('uses PCC and rounds every differential to one decimal before selection',()=>{
  const r=calc([round(85,71.2,125,2),round(84),round(86)]);expect(r.table?.rows[0][5]).toBe(10.7);expect(metric(r,'Estimated handicap index')).toBe(8.7);
 });
 it('applies the six-score two-lowest average and minus 1 adjustment',()=>{
  const r=calc([round(82),round(84),round(86),round(88),round(90),round(92)]);expect(metric(r,'Estimated handicap index')).toBe(10);
 });
 it('supports plus-handicap arithmetic for sub-rating scores',()=>expect(metric(calc([round(70),round(71),round(72)]),'Estimated handicap index')).toBe(-4));
 // USGA Rule 5.1c: negative half-ties round upward toward zero.
 // 113/80*(68-72)=-5.65, so the one-decimal differential is -5.6.
 it('rounds a negative half-tie differential toward zero',()=>{
  const r=calc([round(68,72,80),round(84),round(86)]);expect(r.table?.rows[0][5]).toBe(-5.6);expect(metric(r,'Estimated handicap index')).toBe(-7.6);
 });
 // USGA Handicap Committee Guide 2023, page21: total -29.2 / 8 = -3.65,
 // shown as a plus 3.6 Handicap Index (numeric -3.6 in this calculator).
 it('rounds the documented plus-handicap average toward zero at a half tie',()=>{
  const ratings=[70.7,71.8,71.8,71.7,72.3,71.2,71.9,71.8];
  const r=calc([...ratings.map(rating=>round(68,rating)),...Array.from({length:12},()=>round(82))]);
  expect(metric(r,'Estimated handicap index')).toBe(-3.6);
 });
 it('uses the same upward half-tie convention for a plus course handicap',()=>{
  expect(metric(run('course-handicap',{index:'-1.5',slope:'113',rating:'72',par:'72'}),'Course handicap')).toBe(-1);
 });
 it('treats omitted optional PCC as zero',()=>expect(metric(calc([{score:82,rating:72,slope:113},round(84),round(86)]),'Estimated handicap index')).toBe(8));
 it('treats blank optional PCC as zero',()=>expect(metric(calc([{score:82,rating:72,slope:113,pcc:''},round(84),round(86)]),'Estimated handicap index')).toBe(8));
 it('applies the 54 index ceiling for a valid high adjusted score',()=>expect(metric(calc([round(180),round(180),round(180)]),'Estimated handicap index')).toBe(54));
 it('supports the full declared row input range through differential selection',()=>{
  const r=calc([round(18,90,55,3),round(84),round(86)]);expect(r.table?.rows[0][5]).toBe(-154.1);expect(metric(r,'Estimated handicap index')).toBe(-156.1);
 });
 for(const length of [0,2,21])it(`rejects unsupported round count ${length}`,()=>expect(()=>calc(Array.from({length},()=>round(82)))).toThrow(/3.20/));
 for(const [key,value] of [['score',81.5],['rating',91],['slope',54],['slope',113.5],['pcc',4],['pcc',.5],['rating','not-a-number']] as const)it(`rejects invalid ${key}=${value}`,()=>expect(()=>calc([{...round(82),[key]:value},round(84),round(86)])).toThrow());
 it('dispatches the registered modular row mode',async()=>{
  const mode=definitionMap.get('golf-handicap-calculator')!.modes.find(m=>m.algorithm==='golf-rounds')!;expect(mode).toBeDefined();
  const r=await calculate('everyday',mode,{...defaults(mode),rounds:JSON.stringify([round(82),round(84),round(86)])});expect(metric(r,'Estimated handicap index')).toBe(8);
 });
 it('keeps standalone differential rounding consistent with the row workflow',async()=>{
  const mode=definitionMap.get('golf-handicap-calculator')!.modes.find(m=>m.algorithm==='golf-differential')!;
  const r=await calculate('everyday',mode,{...defaults(mode),score:'68',rating:'72',slope:'80',pcc:'0'});expect(metric(r,'Score differential')).toBe(-5.6);
 });
});
