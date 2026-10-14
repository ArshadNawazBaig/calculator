import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';

// Deterministic web exports. The supplied logo and favicon originals stay intact.
const logo='public/finflo-logo-transparent.png';
const mark='public/finflo-favicon-white.png';
// Browser favicons cannot use CSS border-radius; export transparent rounded corners.
const roundedMark=await sharp(mark).resize(512,512).composite([{
  input:Buffer.from('<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="112" fill="white"/></svg>'),
  blend:'dest-in',
}]).png().toBuffer();
await sharp(logo).resize({width:626}).webp({quality:94}).toFile('public/finflo-logo.webp');
await import('./prepare-theme-logos.mjs');
for(const [size,name] of [[16,'favicon-16x16.png'],[32,'favicon-32x32.png'],[180,'apple-touch-icon.png'],[192,'icon-192.png'],[512,'icon-512.png']]){
  await sharp(size<=32?roundedMark:mark).resize(size,size).png().toFile(`public/${name}`);
}
// Store PNG frames in a standard ICO directory for different browser pixel densities.
const sizes=[16,32,48];
const frames=await Promise.all(sizes.map(size=>sharp(roundedMark).resize(size,size).png().toBuffer()));
const directory=Buffer.alloc(6+16*frames.length);
directory.writeUInt16LE(1,2);
directory.writeUInt16LE(frames.length,4);
let offset=directory.length;
frames.forEach((frame,i)=>{
  const entry=6+16*i;
  directory.writeUInt8(sizes[i],entry);
  directory.writeUInt8(sizes[i],entry+1);
  directory.writeUInt16LE(1,entry+4);
  directory.writeUInt16LE(32,entry+6);
  directory.writeUInt32LE(frame.length,entry+8);
  directory.writeUInt32LE(offset,entry+12);
  offset+=frame.length;
});
await writeFile('public/favicon.ico',Buffer.concat([directory,...frames]));
await writeFile('public/site.webmanifest',JSON.stringify({name:'Finflo — Free calculators',short_name:'Finflo',description:'Free calculators for money, health, math, and everyday life.',start_url:'/',display:'standalone',background_color:'#ffffff',theme_color:'#087f5b',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'}]},null,2)+'\n');
console.log('Exported supplied brand assets for header, favicon, Apple touch icon, and web manifest.');
