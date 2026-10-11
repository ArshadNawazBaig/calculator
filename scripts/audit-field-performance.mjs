import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';

const output=process.env.FIELD_OUTPUT||'test-results/field-performance.json';
const key=process.env.CRUX_API_KEY;
const report={checkedAt:new Date().toISOString(),origin:'https://finflo.org',source:'Chrome UX Report API',scope:'Origin-level aggregated field data; not a lab test or calculator-usage count.',status:key?'requested':'requires_api_key',results:[]};
if(key) for(const formFactor of ['PHONE','DESKTOP']) {
  try {
    const response=await fetch('https://chromeuxreport.googleapis.com/v1/records:queryRecord',{
      method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key},
      body:JSON.stringify({origin:report.origin,formFactor,metrics:['largest_contentful_paint','interaction_to_next_paint','cumulative_layout_shift']}),
      signal:AbortSignal.timeout(30_000),
    });
    const data=await response.json();
    report.results.push({formFactor,httpStatus:response.status,status:response.ok?'available':response.status===404?'no_matching_record':'request_failed',...(response.ok?{record:data.record}:{errorCode:data.error?.status||'UNKNOWN'})});
  } catch { report.results.push({formFactor,status:'request_failed',errorCode:'NETWORK_OR_RESPONSE_ERROR'}); }
}
if(key)report.status=report.results.every(r=>r.status==='available')?'available':'partial_or_unavailable';
await mkdir(dirname(output),{recursive:true});
await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,status:report.status}));
if(report.results.some(r=>r.status==='request_failed'))process.exitCode=1;
