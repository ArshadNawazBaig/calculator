import {spawnSync} from 'node:child_process';
const env={...process.env,NEXT_PUBLIC_INDEXABLE:'false',NEXT_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false'};
function run(cmd,args){const result=spawnSync(cmd,args,{cwd:process.cwd(),env,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);}
run(process.execPath,['scripts/patch-opennext.mjs']);
run('npx',['opennextjs-cloudflare','build']);
run('npx',['wrangler','deploy','--config','wrangler.bundle.json','--dry-run','--outdir','.open-next/sites-wrapped-bundle']);
run(process.execPath,['scripts/stage-sites.mjs']);
