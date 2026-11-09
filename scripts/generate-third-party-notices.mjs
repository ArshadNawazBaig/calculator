import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root=process.cwd(), required=createRequire(path.join(root,'package.json'));
const prepared=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Karachi',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const evidenceOutput=process.env.NOTICES_EVIDENCE_OUTPUT||'docs/validation/third-party-notices.json';
const packageJson=JSON.parse(await fs.readFile('package.json','utf8'));
const packages=new Map(), groups=new Map();
async function resolvePackage(name,requireFrom){
  try{return requireFrom.resolve(name+'/package.json');}catch{}
  try{let dir=path.dirname(requireFrom.resolve(name));while(dir!==path.dirname(dir)){const file=path.join(dir,'package.json');try{if(JSON.parse(await fs.readFile(file,'utf8')).name===name)return file;}catch{}dir=path.dirname(dir);}}catch{}
  throw new Error('Cannot find installed package '+name);
}
async function addText(label,text){
 text=text.replace(/\r\n?/g,'\n');
 const digest=createHash('sha256').update(text).digest('hex');
 const group=groups.get(digest)||{labels:[],text};group.labels.push(label);groups.set(digest,group);
}
async function visit(name,requireFrom){
 const file=await resolvePackage(name,requireFrom);if(packages.has(file))return;
 const pkg=JSON.parse(await fs.readFile(file,'utf8')),dir=path.dirname(file);
 packages.set(file,{name:pkg.name,version:pkg.version,license:pkg.license,repository:pkg.repository});
 const names=await fs.readdir(dir);const notices=names.filter(name=>/^(licen[sc]e|copying|notice)(\.|$)/i.test(name)).sort();
 if(notices.length){for(const notice of notices)await addText(`${pkg.name}@${pkg.version} — ${notice}`,await fs.readFile(path.join(dir,notice),'utf8'));}
 else if(pkg.name==='seedrandom'){
   for(const filename of ['seedrandom.js',...(await fs.readdir(path.join(dir,'lib'))).filter(f=>f.endsWith('.js')).map(f=>'lib/'+f)]){
     const source=await fs.readFile(path.join(dir,filename),'utf8');const header=source.match(/^\s*\/\*([\s\S]*?)\*\//)?.[0];
     if(header&&/copyright|permission/i.test(header))await addText(`${pkg.name}@${pkg.version} — ${filename} license header`,header);
   }
 }else if(pkg.name==='javascript-natural-sort'){
   const source=await fs.readFile(path.join(dir,'naturalSort.js'),'utf8');const header=source.match(/^\s*\/\*([\s\S]*?)\*\//)?.[0];if(!header)throw Error('Missing natural sort notice');
   await addText(`${pkg.name}@${pkg.version} — naturalSort.js packaged author/license statement`,header);
 }else if(pkg.name==='pg-types'){
   const readme=await fs.readFile(path.join(dir,'README.md'),'utf8');
   const license=readme.slice(readme.indexOf('The MIT License (MIT)'));
   if(!license.includes('Copyright (c) 2014 Brian M. Carlson')||!license.includes('THE SOFTWARE IS PROVIDED'))throw Error('Missing pg-types packaged license');
   await addText(`${pkg.name}@${pkg.version} — README.md license`,license);
 }else if(pkg.name==='pgpass'){
   const readme=await fs.readFile(path.join(dir,'README.md'),'utf8');
   const license=readme.slice(readme.indexOf('Copyright (c) 2013-2016 Hannes Hörl'));
   if(!license.includes('Permission is hereby granted')||!license.includes('THE SOFTWARE IS PROVIDED'))throw Error('Missing pgpass packaged license');
   await addText(`${pkg.name}@${pkg.version} — README.md license`,license);
 }else if(pkg.name==='client-only'||pkg.name==='server-only'){
   await addText(`${pkg.name}@${pkg.version} — packaged license declaration`, 'The installed package.json declares the MIT license. The package contains no separate LICENSE or copyright notice file. The framework resolves these environment marker packages.');
 }else throw Error('No license notice identified for '+pkg.name);
 // Next's root license is included. Its separate server/build dependencies and
 // vendored modules are outside this selected browser-library notice collection.
 if(pkg.name!=='next')for(const dependency of Object.keys(pkg.dependencies||{}))await visit(dependency,createRequire(file));
}
for(const name of Object.keys(packageJson.dependencies))await visit(name,required);
const fonts=[['Manrope','manrope'],['Noto Sans Arabic','notosansarabic'],['Noto Sans Devanagari','notosansdevanagari']];
const fontEvidence=[];
for(const [name,directory] of fonts){
 const url=`https://raw.githubusercontent.com/google/fonts/main/ofl/${directory}/OFL.txt`;const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`${url}: ${response.status}`);const license=await response.text();if(!license.includes('SIL OPEN FONT LICENSE Version 1.1'))throw Error('Unexpected font license');
 await addText(`${name} — Google Fonts OFL.txt\nSource: ${url}`,license);
 fontEvidence.push({name,url,sha256:createHash('sha256').update(license).digest('hex')});
}
const sorted=[...packages.values()].sort((a,b)=>`${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`));
let output=`Finflo — selected third-party software and font notices\nPrepared ${prepared} (Asia/Karachi)\n\nThis collection preserves the supplied license and attribution texts for Finflo's\ndirect application libraries, their installed runtime dependencies (apart from\nNext.js's separate server/build and vendored dependencies), and configured font\nfamilies. Inclusion does not mean every component is delivered to every visitor.\nThe package versions below describe this release's installed dependency set.\nSeparate third-party source datasets and trademarks retain their own terms; this\nfile does not grant rights to them or imply endorsement of Finflo.\n\nLibrary versions and declared licenses:\n`;
for(const pkg of sorted)output+=`- ${pkg.name}@${pkg.version}: ${typeof pkg.license==='string'?pkg.license:JSON.stringify(pkg.license)}\n`;
output+='\nThe following license texts are copied from installed package files or the\nidentified font upstream. Identical supplied texts are shown once with all\nassociated packages listed. Packaged copyright/permission notices are preserved.\n';
for(const group of groups.values())output+=`\n${'='.repeat(72)}\n${group.labels.join('\n')}\n${'-'.repeat(72)}\n${group.text.trim()}\n`;
await fs.writeFile(path.join(root,'public/third-party-notices.txt'),output);
await fs.mkdir(path.dirname(evidenceOutput),{recursive:true});
await fs.writeFile(evidenceOutput,JSON.stringify({prepared,packages:sorted,fonts:fontEvidence,groups:groups.size,bytes:Buffer.byteLength(output)},null,2)+'\n');
console.log(JSON.stringify({packages:sorted.length,fonts:fonts.length,uniqueNotices:groups.size,bytes:Buffer.byteLength(output)}));
