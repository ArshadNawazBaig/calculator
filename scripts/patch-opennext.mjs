import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();
const pkg=path.join(root,'node_modules/@opennextjs/cloudflare/package.json');
const next=JSON.parse(fs.readFileSync(path.join(root,'node_modules/next/package.json'),'utf8'));
if(JSON.parse(fs.readFileSync(pkg,'utf8')).version!=='1.20.10'||next.version!=='16.4.0')throw Error('This research patch is only verified for OpenNext1.20.10 and Next16.4.0.');
const file=path.join(path.dirname(pkg),'dist/cli/build/patches/plugins/load-manifest.js');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
let source=fs.readFileSync(file,'utf8');
const beforeHash="7465f0f005b9a027b1d32e7bafdb23e92e2f3b7937dfbf61fbddcae9c1e9ce41",afterHash="93643147e6cb97589e35b0189afacf4cb8544bf4a41e6ff5b5cb2eeef19be3fe";
if(hash(source)===afterHash){console.log('Verified OpenNext compatibility patch already applied.');process.exit(0);}
if(hash(source)!==beforeHash)throw Error('Unexpected OpenNext file content; refusing to patch an unverified revision.');
const rule=`        {
            filter: /[\\\\/]next[\\\\/]dist[\\\\/]server[\\\\/]node-environment-extensions[\\\\/]console-file\\.js$/,
            callback: async () => ({ contents: '"use strict";' }).contents,
        },
`;
source=source.replace('    return updater.updateContent("inline-load-manifest", [\n','    return updater.updateContent("inline-load-manifest", [\n'+rule).replace('**/{*-manifest,required-server-files,prefetch-hints}.json','**/{*-manifest,required-server-files,prefetch-hints,preview-props}.json');
if(hash(source)!==afterHash)throw Error('Generated patch did not match verified bytes.');
fs.writeFileSync(file,source);
console.log('Applied pinned research OpenNext/Next16.4 compatibility patch.');
