import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {resultPresentation,chartDomain} from '@/lib/calculators/result-presentation';
import type {Result} from '@/lib/calculators/types';
import {ResultCharts} from '@/components/calculators/result-charts';
import {ResultTable} from '@/components/calculators/result-table';

describe('result visualization integrity',()=>{
  const loan:Result={metrics:[],table:{headers:['Payment','Month','Payment amount ($)','Principal ($)','Interest ($)','Balance ($)'],rows:[[1,'2026-11',110,100,10,900],[2,'2026-12',110,101,9,799],[3,'2027-01',805,799,6,0]]}};
  it('uses every actual schedule point, including irregular final payments',()=>{
    const view=resultPresentation(loan,'loan');
    expect(view.series?.points).toEqual([{x:1,label:'1',values:[900]},{x:2,label:'2',values:[799]},{x:3,label:'3',values:[0]}]);
    expect(view.moneyColumns).toEqual([2,3,4,5]);
    expect(resultPresentation(loan,'unknown').series).toBeUndefined();
  });
  it('does not fabricate trends for incomplete, unordered or nonfinite samples',()=>{
    for(const rows of [[[1,5]],[[1,5],[1,6]],[[2,5],[1,6]],[[1,5],[2,Infinity]],[['not a date',5],[2,6]]]){
      expect(resultPresentation({metrics:[],table:{headers:['Year','Balance'],rows}},'dual-contributions').series).toBeUndefined();
    }
    expect(resultPresentation({metrics:[],table:{headers:['Year','Amount'],rows:[[1,5],[2,6]]}},'growth').series).toBeUndefined();
  });
  it('shows losses from authoritative growth metrics without changing engine output',()=>{
    const result:Result={metrics:[{label:'Growth after modeled tax',value:-200}],chart:[{label:'Contributions',value:1000},{label:'Growth',value:0}]};
    const view=resultPresentation(result,'growth');
    expect(view.breakdown?.items[1].value).toBe(-200);
    expect(result.chart?.[1].value).toBe(0);
    const html=renderToStaticMarkup(<ResultCharts breakdown={view.breakdown} currency="USD"/>);
    expect(html).toContain('data-chart="comparison"');
    expect(html).toContain('-$200.00');
    expect(html).not.toMatch(/NaN|Infinity/);
  });
  it('keeps zero and very large signed domains finite',()=>{
    for(const values of [[0,0],[-1e308,1e308],[NaN,Infinity,-Infinity,0]]){
      const domain=chartDomain(values);
      expect(Number.isFinite(domain.min)).toBe(true);expect(Number.isFinite(domain.max)).toBe(true);
      for(const value of values.filter(Number.isFinite))expect(domain.position(value)).toBeGreaterThanOrEqual(0);
      for(const value of values.filter(Number.isFinite))expect(domain.position(value)).toBeLessThanOrEqual(1);
    }
    const view=resultPresentation({metrics:[],chart:[{label:'A',value:0},{label:'B',value:0}]});
    expect(renderToStaticMarkup(<ResultCharts breakdown={view.breakdown} currency="USD"/>)).not.toMatch(/NaN|Infinity/);
    expect(view.breakdown?.title).toBe('Result breakdown');
  });
  it('renders the entire table and preserves user strings and independent currency headings',()=>{
    const rows=Array.from({length:1200},(_,i)=>[i+1,`USD user content ${i}`]);
    const html=renderToStaticMarkup(<ResultTable table={{headers:['USD','GBP'],rows}} currency="EUR" currencyLabels={false}/>);
    expect(html.match(/<tr>/g)).toHaveLength(1201);
    expect(html).toContain('USD user content 1199');
    expect(html).toContain('>USD</th>');expect(html).toContain('>GBP</th>');
    expect(html).not.toMatch(/<details|<summary/);
  });
});
