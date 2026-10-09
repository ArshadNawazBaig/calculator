import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:3100';
const browser=await chromium.launch({headless:true});
const results=[];
for(const profile of ['desktop','mobile'])for(const path of ['/','/mortgage-calculator','/tax-calculator','/calculators']){
 const context=await browser.newContext({viewport:profile==='mobile'?{width:390,height:844}:{width:1440,height:1000},deviceScaleFactor:1});
 const page=await context.newPage();const cdp=await context.newCDPSession(page);
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:profile==='mobile'?150:40,downloadThroughput:(profile==='mobile'?1.6:10)*1024*1024/8,uploadThroughput:750*1024/8});
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile==='mobile'?4:1});
 await page.addInitScript(()=>{window.__lab={lcp:0,cls:0,events:[]};new PerformanceObserver(list=>{for(const e of list.getEntries())window.__lab.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__lab.cls+=e.value;}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())window.__lab.events.push({name:e.name,duration:e.duration,interactionId:e.interactionId});}).observe({type:'event',buffered:true,durationThreshold:16});});
 const response=await page.goto(base+path,{waitUntil:'networkidle'});await page.waitForTimeout(1500);
 const before=await page.evaluate(()=>({...window.__lab,resources:performance.getEntriesByType('resource').map(r=>({name:r.name.split('/').at(-1),encodedBodySize:r.encodedBodySize,transferSize:r.transferSize,initiatorType:r.initiatorType})),navigation:performance.getEntriesByType('navigation')[0].toJSON()}));
 let interactionWallMs=null;
 if(path==='/'){const start=performance.now();await page.getByRole('button',{name:'Calculate payment'}).click();await page.locator('.payment').textContent();interactionWallMs=performance.now()-start;}
 else if(path.endsWith('-calculator')){const start=performance.now();await page.getByRole('button',{name:'Calculate',exact:true}).click();await page.locator('.primary-metric dd').textContent();interactionWallMs=performance.now()-start;}
 await page.waitForTimeout(300);
 const events=await page.evaluate(()=>window.__lab.events);
 results.push({profile,path,status:response.status(),lcpMs:before.lcp,cls:before.cls,interactionWallMs,eventTimings:events,encodedResourceBytes:before.resources.reduce((n,r)=>n+r.encodedBodySize,0),javascriptEncodedBytes:before.resources.filter(r=>r.initiatorType==='script').reduce((n,r)=>n+r.encodedBodySize,0),documentEncodedBytes:before.navigation.encodedBodySize,domContentLoadedMs:before.navigation.domContentLoadedEventEnd});
 await context.close();
}
await browser.close();await mkdir('docs/validation',{recursive:true});
const report={measuredAt:new Date().toISOString(),base,conditions:'Local production next start; Chromium headless, cold browser cache, server already warm. Desktop:1440px/10Mbps/40ms/1x CPU. Mobile:390px/1.6Mbps/150ms/4x CPU. One run per route/profile; lab diagnostics, not p75 field metrics. EventTiming omits interactions shorter than its reporting threshold. Playwright click wall time is not INP.',results};
await writeFile('docs/validation/lab-performance.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
