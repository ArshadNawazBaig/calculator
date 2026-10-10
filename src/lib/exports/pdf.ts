import {PDFDocument} from 'pdf-lib';

export type PdfReport = {
  title:string;
  subtitle:string;
  caption:string;
  metrics:string[][];
  notes:string[];
  table?:string[][];
  tableTitle:string;
  footer:string;
  direction:'ltr'|'rtl';
  locale:string;
  fontFamily:string;
};

/** Word wrap without cutting combining characters in Hindi or Arabic. */
export function wrapText(text:string, width:number, measure:(text:string)=>number, locale:string):string[] {
  const segmenter = new Intl.Segmenter(locale,{granularity:'grapheme'});
  const lines:string[] = [];
  for(const paragraph of text.replace(/\r\n?/g,'\n').split('\n')) {
    let line = '';
    for(const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line?`${line} ${word}`:word;
      if(measure(next)<=width) { line=next; continue; }
      if(line) { lines.push(line); line=''; }
      if(measure(word)<=width) { line=word; continue; }
      for(const {segment} of segmenter.segment(word)) {
        if(line&&measure(line+segment)>width) { lines.push(line); line=''; }
        line+=segment;
      }
    }
    lines.push(line);
  }
  return lines;
}

/**
 * Build locally, one A4 canvas at a time. Browser text shaping preserves the
 * site's Arabic/Hindi fonts. These printable pages are raster images; CSV
 * remains available for selectable, machine-readable result data.
 */
export async function resultPdf(report:PdfReport, signal?:AbortSignal):Promise<Blob> {
  await document.fonts.ready;
  signal?.throwIfAborted();
  const pdf = await PDFDocument.create();
  pdf.setTitle(report.title);
  pdf.setAuthor('Finflo');
  pdf.setLanguage(report.locale);
  const landscape = (report.table?.[0]?.length??0)>6;
  const width = landscape?842:595, height = landscape?595:842;
  const margin=36, bottom=height-44, contentWidth=width-margin*2, lineHeight=16, padding=4;
  const canvas = document.createElement('canvas');
  canvas.width=width*2; canvas.height=height*2;
  const context=canvas.getContext('2d');
  if(!context)throw new Error('canvas-unavailable');
  const ctx:CanvasRenderingContext2D=context;
  const rtl=report.direction==='rtl';
  let y=margin, pageNumber=0;
  function font(size=11,bold=false) {ctx.font=`${bold?600:400} ${size}px ${report.fontFamily}`;}
  function startPage() {
    ctx.setTransform(2,0,0,2,0,0);
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,width,height);
    ctx.textBaseline='top'; ctx.direction=report.direction; ctx.textAlign=rtl?'right':'left';
    y=margin;
  }
  function textLine(text:string,x:number,top:number,cellWidth:number) {
    ctx.fillText(text,rtl?x+cellWidth:x,top);
  }
  async function finishPage() {
    signal?.throwIfAborted();
    font(9); ctx.fillStyle='#53685d';
    textLine(`Finflo · ${++pageNumber}`,margin,height-27,contentWidth);
    const png=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('canvas-export-failed')),'image/png'));
    const image=await pdf.embedPng(await png.arrayBuffer());
    pdf.addPage([width,height]).drawImage(image,{x:0,y:0,width,height});
    await pdf.flush();
    // Yield between pages so long schedules keep the mobile interface responsive.
    await new Promise(resolve=>setTimeout(resolve,0));
    signal?.throwIfAborted();
  }
  async function newPage() {await finishPage();startPage();}
  async function paragraph(text:string,size=11,bold=false) {
    font(size,bold);
    const lines=wrapText(text,contentWidth,value=>ctx.measureText(value).width,report.locale);
    const spacing=Math.max(lineHeight,size*1.5);
    for(const line of lines) {
      if(y+spacing>bottom)await newPage();
      font(size,bold);ctx.fillStyle=bold?'#14332a':'#3c5548';
      textLine(line,margin,y,contentWidth);y+=spacing;
    }
    y+=8;
  }
  async function grid(rows:string[][], repeatHeader=false) {
    if(!rows.length)return;
    const columns=rows.reduce((max,row)=>Math.max(max,row.length),1);
    const cellWidth=contentWidth/columns;
    const layout=(row:string[],bold=false)=>{
      font(10,bold);
      return Array.from({length:columns},(_,index)=>wrapText(row[index]??'',cellWidth-padding*2,value=>ctx.measureText(value).width,report.locale));
    };
    const header=repeatHeader?layout(rows[0],true):undefined;
    // Pathological long headings may span pages, just like long result cells.
    const headerHeight=header?Math.max(...header.map(lines=>lines.length))*lineHeight+padding*2:0;
    const canRepeatHeader=headerHeight>0&&headerHeight<(bottom-margin)/3;
    function paint(cells:string[][],offset:number,count:number,bold:boolean,shaded:boolean) {
      const rowHeight=count*lineHeight+padding*2;
      ctx.fillStyle=shaded?'#eef6f1':'#ffffff';ctx.fillRect(margin,y,contentWidth,rowHeight);
      font(10,bold);ctx.fillStyle='#14332a';
      cells.forEach((lines,index)=>{
        const x=margin+(rtl?columns-1-index:index)*cellWidth+padding;
        lines.slice(offset,offset+count).forEach((line,lineIndex)=>textLine(line,x,y+padding+lineIndex*lineHeight,cellWidth-padding*2));
      });
      ctx.strokeStyle='#dce7df';ctx.beginPath();ctx.moveTo(margin,y+rowHeight);ctx.lineTo(width-margin,y+rowHeight);ctx.stroke();
      y+=rowHeight;
    }
    for(let rowIndex=0;rowIndex<rows.length;rowIndex++) {
      signal?.throwIfAborted();
      const isHeader=repeatHeader&&rowIndex===0;
      const cells=layout(rows[rowIndex],isHeader);
      const lineCount=Math.max(...cells.map(lines=>lines.length));
      const rowHeight=lineCount*lineHeight+padding*2;
      const pageRoom=bottom-margin-(repeatHeader&&canRepeatHeader&&!isHeader?headerHeight:0);
      if(y+rowHeight>bottom&&rowHeight<=pageRoom) {
        await newPage();
        if(header&&canRepeatHeader&&!isHeader)paint(header,0,Math.max(...header.map(lines=>lines.length)),true,true);
      }
      let offset=0;
      while(offset<lineCount) {
        const available=Math.floor((bottom-y-padding*2)/lineHeight);
        if(available<1) {
          await newPage();
          if(header&&canRepeatHeader&&!isHeader)paint(header,0,Math.max(...header.map(lines=>lines.length)),true,true);
          continue;
        }
        const count=Math.min(available,lineCount-offset);
        paint(cells,offset,count,isHeader,isHeader||rowIndex%2===0);
        offset+=count;
      }
    }
    y+=14;
  }
  try {
    startPage();
    await paragraph(report.title,20,true);
    await paragraph(report.subtitle,12);
    await paragraph(report.caption,10);
    await grid(report.metrics);
    for(const note of report.notes)await paragraph(note);
    if(report.table?.length) {
      await paragraph(report.tableTitle,14,true);
      await grid(report.table,true);
    }
    await paragraph(report.footer,9);
    await finishPage();
    const bytes=await pdf.save();
    signal?.throwIfAborted();
    return new Blob([new Uint8Array(bytes)],{type:'application/pdf'});
  } finally {
    canvas.width=canvas.height=0;
  }
}
