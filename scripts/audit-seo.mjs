import {chromium} from 'playwright';
import {mkdir, writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {request as httpRequest} from 'node:http';
import {request as httpsRequest} from 'node:https';

// Audit the initial server HTML without executing page scripts or fetching external links.
const base = new URL(process.env.TEST_URL || 'http://127.0.0.1:3100');
const canonical = new URL(process.env.CANONICAL_ORIGIN || 'https://finflo.org');
const output = process.env.SEO_OUTPUT || 'docs/validation/seo-crawl.json';
const concurrency = Math.max(1, Math.min(8, Number(process.env.SEO_CONCURRENCY) || 4));
const errors = [], pages = [], internalPaths = new Set();
const browser = await chromium.launch({headless:true});
const normalizeURL = value => new URL(value).href;
const alternateSignature = alternates => JSON.stringify(Object.entries(alternates).map(([lang,url])=>[lang,normalizeURL(url)]).sort());
const fetchPage = path => new Promise((resolve,reject)=>{
  const url=new URL(path,base), request=url.protocol==='https:'?httpsRequest:httpRequest;
  // Node's fetch can discard Host overrides; the HTTP client preserves the real host-rule check.
  const req=request(url,{signal:AbortSignal.timeout(30000),headers:{host:canonical.host,'user-agent':'FinfloSEOCheck/1.0'}},response=>{
    const chunks=[];
    response.on('data',chunk=>chunks.push(chunk));
    response.on('error',reject);
    response.on('end',()=>resolve(new Response(Buffer.concat(chunks),{
      status:response.statusCode,
      headers:Object.fromEntries(Object.entries(response.headers).filter(([,value])=>value!==undefined).map(([key,value])=>[key,Array.isArray(value)?value.join(', '):value])),
    })));
  });
  req.on('error',reject);req.end();
});
try {
  const parser = await browser.newPage();
  const sitemapResponse = await fetchPage('/sitemap.xml');
  if(sitemapResponse.status!==200) throw Error(`Sitemap HTTP ${sitemapResponse.status}`);
  const entries = await parser.evaluate(xml=>{
    const doc = new DOMParser().parseFromString(xml,'application/xml');
    if(doc.querySelector('parsererror')) throw Error('Invalid sitemap XML');
    return [...doc.getElementsByTagName('url')].map(node=>({
      url:node.getElementsByTagName('loc')[0]?.textContent,
      alternates:Object.fromEntries([...node.getElementsByTagNameNS('http://www.w3.org/1999/xhtml','link')].map(link=>[link.getAttribute('hreflang'),link.getAttribute('href')])),
    }));
  },await sitemapResponse.text());
  if(!entries.length) throw Error('Empty sitemap. Build with NEXT_PUBLIC_INDEXABLE=true before auditing production SEO.');
  const urls = new Set(entries.map(entry=>entry.url));
  if(urls.size!==entries.length) errors.push('Duplicate sitemap URLs');
  const byURL = new Map(entries.map(entry=>[entry.url,entry]));
  for(const entry of entries) {
    if(new URL(entry.url).origin!==canonical.origin) errors.push(`${entry.url}: wrong sitemap origin`);
    for(const [lang,url] of Object.entries(entry.alternates)) {
      if(!urls.has(url)) errors.push(`${entry.url}: ${lang} alternate missing from sitemap: ${url}`);
      const target=byURL.get(url);
      if(target&&alternateSignature(target.alternates)!==alternateSignature(entry.alternates)) errors.push(`${entry.url}: nonreciprocal ${lang} alternate`);
    }
  }
  const robotsResponse=await fetchPage('/robots.txt'), robots=await robotsResponse.text();
  if(robotsResponse.status!==200||!robots.includes(`${canonical.origin}/sitemap.xml`)) errors.push('robots.txt lacks the canonical sitemap');
  if(/^Disallow:\s*\/\s*$/mi.test(robots)) errors.push('robots.txt disallows the whole site');
  let next=0;
  await Promise.all(Array.from({length:concurrency},async()=>{
    const page=await browser.newPage();
    for(let index=next++;index<entries.length;index=next++) {
      const entry=entries[index], path=new URL(entry.url).pathname;
      try {
        const response=await fetchPage(path), html=await response.text();
        const parsed=await page.evaluate(html=>{
          const doc=new DOMParser().parseFromString(html,'text/html');
          return {
            title:doc.title,description:doc.querySelector('meta[name="description"]')?.content||'',
            canonicals:[...doc.querySelectorAll('link[rel="canonical"]')].map(link=>link.getAttribute('href')),
            robots:[...doc.querySelectorAll('meta[name="robots"],meta[name="googlebot"]')].map(meta=>meta.content).join(', '),
            h1:[...doc.querySelectorAll('h1')].map(h=>h.textContent.trim()),lang:doc.documentElement.lang,
            alternates:Object.fromEntries([...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map(link=>[link.getAttribute('hreflang'),link.getAttribute('href')])),
            schemas:[...doc.querySelectorAll('script[type="application/ld+json"]')].map(script=>JSON.parse(script.textContent)),
            links:[...doc.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')),
          };
        },html);
        const issues=[];
        if(response.status!==200) issues.push(`HTTP ${response.status}`);
        if(parsed.canonicals.length!==1||normalizeURL(parsed.canonicals[0])!==normalizeURL(entry.url)) issues.push('non-self or duplicate canonical');
        if(!parsed.title.trim()||!parsed.description.trim()) issues.push('missing title or description');
        if(parsed.h1.length!==1||!parsed.h1[0]) issues.push('missing or duplicate H1');
        if(/(?:noindex|\bnone\b)/i.test(parsed.robots+','+(response.headers.get('x-robots-tag')||''))) issues.push('noindex in sitemap');
        if(!parsed.lang) issues.push('missing document language');
        if(Object.keys(entry.alternates).length ? entry.alternates[parsed.lang]!==entry.url : parsed.lang!=='en') issues.push('document language does not match its published language');
        if(alternateSignature(parsed.alternates)!==alternateSignature(entry.alternates)) issues.push('HTML/sitemap hreflang mismatch');
        for(const href of parsed.links) {
          const link=new URL(href,entry.url);
          if(link.origin===canonical.origin) internalPaths.add(link.pathname);
        }
        for(const issue of issues) errors.push(`${entry.url}: ${issue}`);
        pages.push({url:entry.url,status:response.status,title:parsed.title,description:parsed.description,lang:parsed.lang,h1:parsed.h1,schemas:parsed.schemas.map(schema=>schema['@type']),htmlBytes:Buffer.byteLength(html),issues});
      } catch(error) {errors.push(`${entry.url}: ${error.message}`);}
      if(pages.length>0&&pages.length%200===0) console.log(`Checked ${pages.length}/${entries.length} sitemap pages`);
    }
    await page.close();
  }));
  const extraPaths=[...internalPaths].filter(path=>!urls.has(canonical.origin+path)), extraChecks=[];
  // Query parameters and fragments are intentionally excluded from this link-target check.
  for(const path of extraPaths) {
    try {
      const response=await fetchPage(path);
      extraChecks.push({path,status:response.status,location:response.headers.get('location')});
      if(response.status!==200) errors.push(`${path}: internal link target HTTP ${response.status}`);
      await response.body?.cancel();
    } catch(error) {errors.push(`${path}: ${error.message}`);}
  }
  const localizedSearches=['es','fr','de','pt','ar','hi','tl'].filter(locale=>urls.has(`${canonical.origin}/${locale}`)).map(locale=>`/${locale}/search?q=mortgage`);
  for(const path of ['/search?q=mortgage',...localizedSearches,'/real-estate-calculator']) {
    const response=await fetchPage(path), html=await response.text();
    const noindex=await parser.evaluate(html=>new DOMParser().parseFromString(html,'text/html').querySelector('meta[name="robots"]')?.content.includes('noindex'),html);
    if(response.status!==200||!noindex) errors.push(`${path}: expected 200 and noindex`);
  }
  for(const path of ['/this-calculator-does-not-exist',...localizedSearches.map(path=>path.split('/search')[0]+'/this-calculator-does-not-exist')]) {
    const response=await fetchPage(path);
    if(response.status!==404) errors.push(`${path}: expected 404, got ${response.status}`);
    await response.body?.cancel();
  }
  const duplicateGroups=key=>Object.values(Object.groupBy(pages,page=>`${page.lang}:${page[key]}`)).filter(group=>group.length>1).map(group=>({locale:group[0].lang,value:group[0][key],urls:group.map(page=>page.url)}));
  const report={measuredAt:new Date().toISOString(),base:base.origin,canonical:canonical.origin,scope:'All sitemap URLs; initial server HTML; unique internal path targets. No external links, fragment targets, JavaScript rendering, search-engine indexing status, or field performance measured.',sitemapURLs:entries.length,checkedPages:pages.length,internalPaths:internalPaths.size,extraChecks,errors,duplicateTitles:duplicateGroups('title'),duplicateDescriptions:duplicateGroups('description'),pages:pages.sort((a,b)=>a.url.localeCompare(b.url))};
  await mkdir(dirname(output),{recursive:true});
  await writeFile(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({output,sitemapURLs:entries.length,checkedPages:pages.length,internalPaths:internalPaths.size,errors,duplicateTitles:report.duplicateTitles.length,duplicateDescriptions:report.duplicateDescriptions.length},null,2));
  if(errors.length) process.exitCode=1;
} finally {await browser.close();}
