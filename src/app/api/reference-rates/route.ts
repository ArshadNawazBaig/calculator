import {sharedSnapshot} from '@/lib/data/snapshot-cache';
import {ECB_FEED,parseEcbFeed} from '@/lib/data/reference-rates';
async function loadSnapshot(){
  try{
    const response=await fetch(ECB_FEED,{next:{revalidate:3600},signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw Error('Upstream unavailable');
    const data=parseEcbFeed(await response.text());
    return Response.json(data,{headers:{'Cache-Control':'public, max-age=300, s-maxage=3600','X-Robots-Tag':'noindex'}});
  }catch{
    return Response.json({error:'Reference rates are temporarily unavailable. Use a manually supplied rate or retry later.'},{status:503,headers:{'Cache-Control':'no-store','Retry-After':'300','X-Robots-Tag':'noindex'}});
  }
}

export async function GET(){return sharedSnapshot('reference-rates',300,loadSnapshot);}
