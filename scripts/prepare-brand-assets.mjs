import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';

// Deterministic web exports. The supplied logo and favicon originals stay intact.
const logo='public/finflo-logo-transparent.png';
// Keep the background opaque, including the display and key cutouts, so search
// engines and browsers cannot replace transparent regions with a white backing.
const mark='public/icon-512-black.png';
if(!process.argv.includes('--icons-only')){
  await sharp(logo).resize({width:626}).webp({quality:94}).toFile('public/finflo-logo.webp');
  await import('./prepare-theme-logos.mjs');
}
const faviconSizes=[16,32,48,64,128,192,256];
const exports=[...faviconSizes.map(size=>[size,`favicon-${size}x${size}.png`]),[180,'apple-touch-icon.png'],[192,'icon-192.png'],[512,'icon-512.png']];
for(const [size,name] of exports){
  await sharp(mark).resize(size,size).removeAlpha().png().toFile(`public/${name}`);
}
// Store PNG frames in a standard ICO directory for different browser pixel densities.
const sizes=[16,32,48,64,128,256];
const frames=await Promise.all(sizes.map(size=>sharp(mark).resize(size,size).ensureAlpha(1).png().toBuffer()));
const directory=Buffer.alloc(6+16*frames.length);
directory.writeUInt16LE(1,2);
directory.writeUInt16LE(frames.length,4);
let offset=directory.length;
frames.forEach((frame,i)=>{
  const entry=6+16*i;
  // ICO encodes 256px dimensions as zero in its one-byte size fields.
  directory.writeUInt8(sizes[i]===256?0:sizes[i],entry);
  directory.writeUInt8(sizes[i]===256?0:sizes[i],entry+1);
  directory.writeUInt16LE(1,entry+4);
  directory.writeUInt16LE(32,entry+6);
  directory.writeUInt32LE(frame.length,entry+8);
  directory.writeUInt32LE(offset,entry+12);
  offset+=frame.length;
});
await writeFile('public/favicon.ico',Buffer.concat([directory,...frames]));
await writeFile('public/site.webmanifest',JSON.stringify({name:'Finflo — Free calculators',short_name:'Finflo',description:'Free calculators for money, health, math, and everyday life.',start_url:'/',display:'standalone',background_color:'#101113',theme_color:'#101113',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'}]},null,2)+'\n');
console.log('Exported brand assets with opaque black favicons, Apple touch icon, and app icons.');
