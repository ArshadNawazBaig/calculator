import {createServer} from 'vite';
import {execFileSync} from 'node:child_process';
import {mkdtemp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {createHash} from 'node:crypto';

// Independent offset oracle: official IANA sources -> zic -> Python zoneinfo.
// JavaScript Intl is deliberately not used to produce expected offsets.
const output = process.env.CLOCK_AUDIT_OUTPUT || 'docs/validation/clock-rules-2026-11-09.json';
const data = JSON.parse(await readFile('src/data/clock-zones.json','utf8'));
const corrections = JSON.parse(await readFile('src/data/time-zone-rule-overrides.json','utf8'));
const latestResponse = await fetch('https://data.iana.org/time-zones/tzdb/version',{signal:AbortSignal.timeout(30000)});
if (!latestResponse.ok) throw Error(`Cannot verify latest IANA version: HTTP ${latestResponse.status}`);
const latestVersion = (await latestResponse.text()).trim();
const directory = await mkdtemp(join(tmpdir(),'finflo-clock-rules-'));
const source = `https://data.iana.org/time-zones/releases/tzdata${corrections.version}.tar.gz`;
const response = await fetch(source,{signal:AbortSignal.timeout(30000)});
if (!response.ok) throw Error(`Official IANA source: HTTP ${response.status}`);
const archive = Buffer.from(await response.arrayBuffer());
const archivePath = join(directory,'tzdata.tar.gz'), compiled = join(directory,'compiled');
let server;
try {
  await writeFile(archivePath,archive);
  execFileSync('tar',['-xzf',archivePath,'-C',directory]);
  await mkdir(compiled);
  execFileSync('zic',['-d',compiled,...['africa','antarctica','asia','australasia','europe','northamerica','southamerica','etcetera','backward'].map(file=>join(directory,file))]);
  const input = join(directory,'input.json');
  await writeFile(input,JSON.stringify({zones:data.zones,corrections}));
  const oracle = JSON.parse(execFileSync('python3',['-c',`
import json, sys, datetime, zoneinfo, pathlib
data=json.load(open(sys.argv[1])); compiled=pathlib.Path(sys.argv[2]); results=[]
for row in data['zones']:
  for name in [row['id']]+row['aliases']:
    with (compiled/name).open('rb') as handle: zone=zoneinfo.ZoneInfo.from_file(handle,key=name)
    instants=set()
    for year in range(2026,2036):
      for month in range(1,13): instants.add(int(datetime.datetime(year,month,15,12,tzinfo=datetime.timezone.utc).timestamp()))
    rule=data['corrections']['zones'].get(row['id'])
    if rule:
      for at,offset in rule['intervals'][1:]: instants.update([at-1,at,at+1])
    samples=[]
    for at in sorted(instants):
      local=datetime.datetime.fromtimestamp(at,datetime.timezone.utc).astimezone(zone)
      samples.append([at,int(local.utcoffset().total_seconds()/60),local.strftime('%Y-%m-%dT%H:%M:%S')])
    results.append({'id':row['id'],'name':name,'samples':samples})
print(json.dumps(results))
`,input,compiled],{maxBuffer:20_000_000}).toString());
  server = await createServer({configFile:false,server:{middlewareMode:true},resolve:{alias:{'@':resolve('src')}}});
  const {offsetMinutes,supportsZone} = await server.ssrLoadModule('/src/lib/time/engine.ts');
  const {localDateTime} = await server.ssrLoadModule('/src/lib/time/wall-time.ts');
  const {timeRoute,zoneById,zoneHref} = await server.ssrLoadModule('/src/lib/time/catalog.ts');
  const errors=[], records=[];
  if (latestVersion !== corrections.version || data.version !== corrections.version) errors.push(`Bundled directory/corrections must be reviewed against latest IANA ${latestVersion}`);
  let checkedSamples=0, nativeMismatches=0;
  for (const entry of oracle) {
    const issues=[], nativeDifferences=[];
    const zone = zoneById.get(entry.name);
    if (!zone || zone.id !== entry.id || !timeRoute(zoneHref(zone))) issues.push('Identity, alias, or public route mismatch');
    if (!supportsZone(entry.name)) issues.push('Runtime does not recognize this identity');
    for (const [second,expected,expectedLocal] of entry.samples) {
      const at=second*1000;
      if (offsetMinutes(at,entry.name)!==expected || localDateTime(at,entry.name)!==expectedLocal) issues.push(`Wrong offset or civil date at ${new Date(at).toISOString()}`);
      const name=new Intl.DateTimeFormat('en',{timeZone:entry.name,timeZoneName:'longOffset'}).formatToParts(at).find(part=>part.type==='timeZoneName').value;
      const match=name.match(/GMT([+-])(\d{2}):(\d{2})/), native=match?(+match[2]*60 + +match[3])*(match[1]==='-'?-1:1):0;
      if (native!==expected) {nativeMismatches++;nativeDifferences.push({at:new Date(at).toISOString(),expected,native});}
      checkedSamples++;
    }
    errors.push(...issues.map(issue=>`${entry.name}: ${issue}`));
    records.push({id:entry.id,name:entry.name,path:zoneHref(zone),samples:entry.samples.length,issues,nativeDifferences});
  }
  const report={checkedAt:new Date().toISOString(),source,sourceSHA256:createHash('sha256').update(archive).digest('hex'),version:data.version,correctionVersion:corrections.version,latestVersion,runtimeTZ:process.versions.tz,scope:'Every bundled regional identity and alias: route identity, monthly offsets and civil dates for 2026–2035, plus one-second checks around every bundled correction transition. Expected values come from separately compiled official IANA data through Python zoneinfo.',limits:['Not every historical instant or future political change is verified.','Other browsers may carry different timezone versions. Corrections cover only the seven explicitly bundled regions in 2026–2035.','This is systematic programmatic curation, not a native-language or subject-expert editorial review of each location.'],regionalRoutes:data.zones.length,identities:records.length,checkedSamples,nativeMismatches,errors,records};
  await mkdir(resolve(output,'..'),{recursive:true});
  await writeFile(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({output,regionalRoutes:report.regionalRoutes,identities:report.identities,checkedSamples,nativeMismatches,errors},null,2));
  if (errors.length) process.exitCode=1;
} finally {
  await server?.close();
  await rm(directory,{recursive:true,force:true});
}
