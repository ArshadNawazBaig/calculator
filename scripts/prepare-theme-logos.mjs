import sharp from 'sharp';

// Preserve the supplied artwork's contours; remove the old dark matte and
// isolated extraction speckles before exporting transparent theme variants.
const {data,info}=await sharp('public/finflo-logo-transparent.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {width,height}=info;
const alpha=Buffer.alloc(width*height);
const clamp=value=>Math.max(0,Math.min(1,value));
for(let pixel=0;pixel<alpha.length;pixel++){
  const offset=pixel*4;
  const [red,green,blue,opacity]=data.subarray(offset,offset+4);
  const isMark=pixel%width<width/3;
  const coverage=isMark?clamp((green-blue-30)/100):clamp((Math.min(red,green,blue)-48)/172);
  alpha[pixel]=Math.round(opacity*coverage);
}

// Keep actual glyphs and discard disconnected tiny flecks from the source.
const visited=new Uint8Array(alpha.length);
for(let start=0;start<alpha.length;start++){
  if(visited[start]||alpha[start]<8) continue;
  const region=[start];
  visited[start]=1;
  for(let cursor=0;cursor<region.length;cursor++){
    const pixel=region[cursor],x=pixel%width,y=Math.floor(pixel/width);
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
      if(x+dx<0||x+dx>=width||y+dy<0||y+dy>=height) continue;
      const neighbor=(y+dy)*width+x+dx;
      if(!visited[neighbor]&&alpha[neighbor]>=8){visited[neighbor]=1;region.push(neighbor);}
    }
  }
  if(region.length<24) for(const pixel of region) alpha[pixel]=0;
}
const smoothAlpha=await sharp(alpha,{raw:{width,height,channels:1}}).median(3).blur(0.3).toColourspace('b-w').raw().toBuffer();
for(const [theme,wordmark] of [['light',[23,25,28]],['dark',[245,245,246]]]){
  const pixels=Buffer.alloc(width*height*4);
  for(let pixel=0;pixel<alpha.length;pixel++){
    const opacity=smoothAlpha[pixel]<3?0:smoothAlpha[pixel];
    if(!opacity) continue;
    const color=pixel%width<width/3?[213,249,21]:wordmark;
    pixels.set(color,pixel*4);
    pixels[pixel*4+3]=opacity;
  }
  const image=sharp(pixels,{raw:{width,height,channels:4}}).extend({top:4,bottom:4,left:4,right:4,background:{r:0,g:0,b:0,alpha:0}});
  await image.clone().png().toFile(`public/finflo-logo-${theme}.png`);
  await image.clone().webp({lossless:true}).toFile(`public/finflo-logo-${theme}.webp`);
}
console.log('Exported transparent light and dark logos with smooth alpha edges.');
