import sharp from 'sharp';
import {copyFile,writeFile} from 'node:fs/promises';

// Deterministic web exports. The supplied logo and favicon originals stay intact.
const logo='public/finflo-logo-transparent.png';
const mark='public/finflo-favicon-white.png';
await sharp(logo).resize({width:626}).webp({quality:94}).toFile('public/finflo-logo.webp');
for(const [size,name] of [[16,'favicon-16x16.png'],[32,'favicon-32x32.png'],[180,'apple-touch-icon.png'],[192,'icon-192.png'],[512,'icon-512.png']]){
  await sharp(mark).resize(size,size).png().toFile(`public/${name}`);
}
await copyFile('public/finflo-favicon-white.ico','public/favicon.ico');
await writeFile('public/site.webmanifest',JSON.stringify({name:'Finflo — Free calculators',short_name:'Finflo',description:'Free calculators for money, health, math, and everyday life.',start_url:'/',display:'standalone',background_color:'#ffffff',theme_color:'#032344',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'}]},null,2)+'\n');
console.log('Exported supplied brand assets for header, favicon, Apple touch icon, and web manifest.');
