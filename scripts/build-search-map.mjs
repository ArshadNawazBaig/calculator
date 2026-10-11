import {createServer} from 'vite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root='docs/research/search';
const research=JSON.parse(await readFile(`${root}/english-clusters-2026-10-11.json`,'utf8'));
const competitorCatalog=JSON.parse(await readFile('docs/audit/catalog.json','utf8'));
const targets={
  'nominal vs effective interest rate':'compound-interest-calculator',
  'mortgage extra payment calculator':'mortgage-payoff-calculator',
  'mortgage amortization schedule':'mortgage-amortization-calculator',
  'how much house can I afford':'house-affordability-calculator',
  'loan payment calculator with schedule':'loan-calculator',
  'age calculator leap year':'age-calculator',
  'final exam grade needed calculator':'grade-calculator',
  'GPA calculator custom scale':'gpa-calculator',
  'take home pay calculator 2026':'take-home-pay-calculator',
  'gross salary to net pay US':'take-home-pay-calculator',
  'Roth vs traditional IRA calculator':'roth-ira-calculator',
  'RMD calculator deadline':'rmd-calculator',
  '401k employer match calculator':'401k-calculator',
};
const server=await createServer({configFile:false,server:{middlewareMode:true},resolve:{alias:{'@':resolve('src')}}});
try {
  const {catalog,definitions}=await server.ssrLoadModule('/src/lib/calculators/registry.ts');
  const bySlug=new Map(definitions.map(d=>[d.slug,d]));
  const rows=catalog.map(tool=>{
    const definition=bySlug.get(tool.slug);
    const cluster=research.clusters.find(c=>c.primary===tool.slug)||research.clusters.find(c=>c.supporting.includes(tool.slug));
    const competitor=competitorCatalog.tools.find(item=>item.slug===tool.slug);
    const matchedQueries=research.clusters.filter(c=>c.id!=='australia-research').flatMap(c=>c.queries.filter(q=>(targets[q]||c.primary)===tool.slug));
    return {url:`https://finflo.org/${tool.slug}`,pageType:definition?'calculator':'directory',category:tool.category,primaryKeyword:matchedQueries[0]||tool.title.toLowerCase(),secondaryKeywords:matchedQueries.slice(1),intent:definition?.description||'Navigate the related real-estate calculators.',market:cluster?.market||'English; validate regional applicability before promotion',priority:cluster?.priority||'P3',evidence:[...new Set([...(cluster?cluster.competitors.map(c=>c.url):[]),...(competitor?[competitor.final_url]:[])])],competitorCheckedAt:competitor?.fetched_at||'',confidence:cluster?.confidence||'Observed competitor page and catalog-derived keyword; demand unverified',status:cluster?'Researched cluster; individual supporting-page demand unmeasured':'Competitor catalog mapped; public query demand unmeasured',modeIntents:definition?.modes.map(m=>m.title)||[],cannibalizationRule:cluster?.opportunity||'Retain the existing URL. Compare overlapping modes with adjacent tools before targeting additional synonyms.',existingOrNew:'existing',validation:cluster?.validation||'Review sources, examples and regional scope; gather query evidence before changing search presentation.'};
  });
  for(const c of research.clusters) for(const slug of [c.primary,...c.supporting]) if(!catalog.some(t=>t.slug===slug))throw Error(`Unknown target ${slug}`);
  const queryMap=new Map();
  for(const c of research.clusters) for(const query of c.queries){const target=c.id==='australia-research'?'':targets[query]||c.primary;if(target&&!catalog.some(t=>t.slug===target))throw Error(`Unknown query target ${target}`);if(queryMap.has(query)&&queryMap.get(query)!==target)throw Error(`Duplicate primary intent: ${query}`);queryMap.set(query,target);}
  const headers=['url','pageType','category','primaryKeyword','secondaryKeywords','intent','market','priority','evidence','competitorCheckedAt','confidence','status','modeIntents','cannibalizationRule','existingOrNew','validation'];
  const cell=value=>'"'+(Array.isArray(value)?value.join(' | '):String(value??'')).replaceAll('"','""')+'"';
  await mkdir(root,{recursive:true});
  await writeFile(`${root}/english-page-map.csv`,headers.join(',')+'\n'+rows.map(row=>headers.map(h=>cell(row[h])).join(',')).join('\n')+'\n');
  await writeFile(`${root}/english-query-map.csv`,'query,targetUrl,cluster,market,priority,evidenceStatus\n'+research.clusters.flatMap(c=>c.queries.map(q=>[q,queryMap.get(q)?`https://finflo.org/${queryMap.get(q)}`:'',c.id,c.market,c.priority,c.id==='australia-research'?'Research only; no verified regional target':'Qualitative search/intent research; no verified demand metric'].map(cell).join(','))).join('\n')+'\n');
  console.log(JSON.stringify({pages:rows.length,clusters:research.clusters.length,queries:queryMap.size,pagesWithCompetitorEvidence:rows.filter(r=>r.evidence.length).length}));
} finally {await server.close();}
