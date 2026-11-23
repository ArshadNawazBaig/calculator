import {createServer} from 'vite';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {attributes} from './html-attributes.mjs';

const output = process.env.SOURCE_OUTPUT || 'docs/validation/source-links.json';
const server = await createServer({configFile:false, server:{middlewareMode:true}, resolve:{alias:{'@':resolve('src')}}});
const references = new Map();
function add(url, page, label) {
  if (!/^https?:\/\//.test(url)) return;
  const target = new URL(url); target.hash = '';
  const key = target.href;
  if (!references.has(key)) references.set(key, {url:key, references:[]});
  const entry = references.get(key);
  if (!entry.references.some(item => item.page === page && item.url === url)) entry.references.push({page, label, url});
}
try {
  const {definitions} = await server.ssrLoadModule('/src/lib/calculators/registry.ts');
  const {guides} = await server.ssrLoadModule('/src/data/guides.ts');
  const {information} = await server.ssrLoadModule('/src/data/information.ts');
  const articles = JSON.parse(await readFile(new URL('../src/data/calculator-content.json', import.meta.url),'utf8'));
  for (const tool of definitions) for (const source of tool.sources) add(source.url, `/${tool.slug}`, source.title);
  for (const [slug, page] of [...Object.entries(articles), ...Object.entries(information), ...Object.entries(guides).map(([slug,page])=>[`guides/${slug}`,page])]) {
    for (const section of page.sections) for (const link of section.links || []) add(link.href, `/${slug}`, link.label);
  }
} finally { await server.close(); }

const entries = [...references.values()].sort((a,b)=>a.url.localeCompare(b.url));
const results = [];
const pending = new Set();
const hostQueues = new Map();
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));

function classifySource(response, title, html) {
  if ([404, 410].includes(response.status)) return 'broken';
  if ([403, 429].includes(response.status)) return 'access_unverified';
  if (!response.ok) return 'http_error';
  const gateTitle = /page not found|404 not found|access denied|just a moment|robot check|^checking your browser\b|^redirecting[.…]*$/i;
  const cookieGate = /<h1\b[^>]*>\s*Cookies must be enabled\s*<\/h1>/i;
  return gateTitle.test(title || '') || cookieGate.test(html) ? 'content_unverified' : 'reachable';
}

function fragmentTargets(html) {
  const targets = new Set();
  const markup = html.replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  for (const [tag, name] of markup.matchAll(/<([a-z][\w:.-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
    const attrs = attributes(tag);
    if (attrs.id) targets.add(attrs.id);
    if (name.toLowerCase() === 'a' && attrs.name) targets.add(attrs.name);
  }
  return targets;
}

async function inspect(entry) {
  const host = new URL(entry.url).host;
  const previous = hostQueues.get(host) || Promise.resolve();
  let finish;
  hostQueues.set(host, new Promise(resolve=>{finish=resolve;}));
  await previous;
  try {
    const response = await fetch(entry.url, {redirect:'follow', signal:AbortSignal.timeout(20_000), headers:{'User-Agent':'FinfloSourceReview/1.0 (+https://finflo.org/contact)', Accept:'text/html,application/pdf;q=0.9,*/*;q=0.8'}});
    const contentType = response.headers.get('content-type') || '';
    let title = null;
    let complete = false;
    let html = '';
    if (/text\/html/i.test(contentType) && response.body) {
      const reader = response.body.getReader();
      const chunks = [];
      let size = 0;
      while(size < 1_000_000) {
        const item = await reader.read();
        if(item.done) {complete=true;break;}
        chunks.push(item.value); size += item.value.length;
      }
      await reader.cancel();
      html = Buffer.concat(chunks).toString('utf8');
      title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g,' ').trim() || null;
    } else await response.body?.cancel();
    const status = response.status;
    const classification = classifySource(response, title, html);
    const fragmentLinks = entry.references.filter(item => new URL(item.url).hash);
    const targets = fragmentLinks.length && classification === 'reachable' ? fragmentTargets(html) : new Set();
    const fragments = fragmentLinks.map(item=>{
      const hash = decodeURIComponent(new URL(item.url).hash.slice(1));
      let fragmentStatus = 'not_checked';
      if (classification === 'reachable') {
        if (/application\/pdf/i.test(contentType)) fragmentStatus = 'pdf_fragment_not_checked';
        else if (targets.has(hash)) fragmentStatus = 'found';
        else if (complete) fragmentStatus = 'not_found_in_server_html';
      }
      return {page:item.page, fragment:hash, status:fragmentStatus};
    });
    return {...entry,status,finalUrl:response.url,contentType,title,classification,fragments};
  } catch (error) {
    return {...entry,status:null,classification:'request_unverified',error:error.cause?.code || error.name};
  } finally { await sleep(300); finish(); }
}
for (const entry of entries) {
  const promise = inspect(entry).then(result=>{
    results.push(result);
    if(results.length % 25 === 0) console.log(`Checked ${results.length}/${entries.length} references`);
  }).finally(()=>pending.delete(promise));
  pending.add(promise);
  if(pending.size>=4) await Promise.race(pending);
}
await Promise.all(pending);
results.sort((a,b)=>a.url.localeCompare(b.url));
const counts = Object.fromEntries([...new Set(results.map(item=>item.classification))].map(key=>[key,results.filter(item=>item.classification===key).length]));
const report = {checkedAt:new Date().toISOString(),scope:'Distinct external references from calculator definitions and articles, guides and information pages.',limitations:['Reachability does not establish factual correctness or licensing.','Blocked requests and timeouts remain unverified, not confirmed broken links.','Fragment checks inspect server HTML only; PDF page fragments are not checked.'],counts,total:results.length,results};
await mkdir(dirname(output),{recursive:true});
await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,total:results.length,...counts}));
if(counts.broken) process.exitCode=1;
