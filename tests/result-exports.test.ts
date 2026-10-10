import {describe,it,expect} from 'vitest';
import {resultCsv,resultRows} from '@/lib/exports/results';
import {wrapText} from '@/lib/exports/pdf';
import type {Result} from '@/lib/calculators/types';

const options={currency:'USD',currencyLabels:false,locale:'en-US',t:(text:string)=>text};

describe('result file exports',()=>{
  it('retains UTF-8, quoted cells, multiline text and the same numeric precision in a complete CSV',async()=>{
    const result:Result={metrics:[],table:{headers:['Name','Value'],rows:[['हिन्दी, "عربي"\nFilipino',1/3],['Last',-0]]}};
    const csv=resultCsv(result,options);
    const bytes=new Uint8Array(await csv.arrayBuffer());
    expect([...bytes.slice(0,3)]).toEqual([239,187,191]);
    expect(await csv.text()).toBe('"Name","Value"\r\n"हिन्दी, ""عربي""\nFilipino","0.33"\r\n"Last","0"');
    expect(result.table!.rows[0][1]).toBe(1/3);
    expect(csv.type).toBe('text/csv;charset=utf-8');
  });
  it('exports translated warnings and units without replacing them with impossible raw scores',async()=>{
    const result:Result={metrics:[{label:'Score',value:101+2/3,format:'percent',displayValue:'Target not attainable'},{label:'Time',value:1/3,unit:'days'}]};
    const t=(text:string)=>({'Score':'अंक','Target not attainable':'लक्ष्य प्राप्त करना संभव नहीं','days':'दिन'}[text]??text);
    const csv=await resultCsv(result,{...options,t}).text();
    expect(csv).toContain('"अंक","लक्ष्य प्राप्त करना संभव नहीं"');
    expect(csv).toContain('0.33 दिन');
    expect(csv).not.toContain('101.');
  });
  it('uses all table rows, selected currency and translated headers without mutating the result',async()=>{
    const result:Result={metrics:[],table:{headers:['Month','Balance ($)'],rows:Array.from({length:360},(_,i)=>[i+1,1000/3])}};
    const before=structuredClone(result);
    const csv=await resultCsv(result,{...options,currency:'EUR',currencyLabels:true}).text();
    expect(csv.split('\r\n')).toHaveLength(362);
    expect(csv).toContain('"Currency","EUR"');
    expect(csv).toContain('"360","333.33"');
    expect(csv).not.toContain('Balance ($)');
    expect(result).toEqual(before);
    expect(resultRows(result,options).table).toHaveLength(361);
  });
  it('matches localized table numbers and currency precision in the PDF',()=>{
    const result:Result={metrics:[],table:{headers:['Balance ($)','Count'],rows:[[1234.56,1/3]]}};
    expect(resultRows(result,{...options,locale:'de',localizedNumbers:true}).table![1]).toEqual(['1.234,56','0,33']);
    expect(resultRows(result,{...options,currency:'JPY',currencyLabels:true,localizedNumbers:true}).table![1]).toEqual(['1,235','0.33']);
    expect(resultRows(result,{...options,locale:'ar',localizedNumbers:true}).table![1]).toEqual(['١٬٢٣٤٫٥٦','٠٫٣٣']);
  });
});

describe('PDF text wrapping',()=>{
  const measure=(text:string)=>[...text].length;
  it('wraps words and explicit line breaks without losing content',()=>{
    expect(wrapText('A long title\nSecond line',8,measure,'en')).toEqual(['A long','title','Second','line']);
    expect(wrapText('12345678901234567890',6,measure,'en')).toEqual(['123456','789012','345678','90']);
  });
  it('never splits Hindi combining characters or emoji graphemes',()=>{
    const word='हिन्दीहिन्दी👩🏽‍💻';
    const lines=wrapText(word,5,measure,'hi');
    expect(lines.join('')).toBe(word);
    const segments=[...new Intl.Segmenter('hi',{granularity:'grapheme'}).segment(word)].map(item=>item.segment);
    for(const line of lines) {
      let remainder=line;
      while(remainder) {const segment=segments.shift()!;expect(remainder.startsWith(segment)).toBe(true);remainder=remainder.slice(segment.length);}
    }
    expect(segments).toEqual([]);
  });
});
