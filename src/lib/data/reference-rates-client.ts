import {validateReferenceRates,type ReferenceRates} from './reference-rates';
let cached:ReferenceRates|undefined;
let cachedAt=0;
export async function getReferenceRates():Promise<ReferenceRates>{
  if(cached&&Date.now()-cachedAt<3600000){try{return {...validateReferenceRates(cached),cached:true};}catch{cached=undefined;}}
  try{
    const response=await fetch('/api/reference-rates',{signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw Error('Rate provider unavailable');
    const data:ReferenceRates=await response.json();
    validateReferenceRates(data);
    cached=data;cachedAt=Date.now();return data;
  }catch{
    if(cached){try{return {...validateReferenceRates(cached),cached:true};}catch{cached=undefined;}}
    throw Error('Current reference rates could not load. Reconnect and select Calculate to retry, or use the manual-rate mode.');
  }
}
