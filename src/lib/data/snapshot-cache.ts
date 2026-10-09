// Bounded per-process/isolate cache and in-flight coalescing. No visitor identity or inputs.
// Materialize in the producer request: workerd streams cannot be shared across requests.
type Snapshot={body:string;status:number;statusText:string;headers:[string,string][];ok:boolean};
const entries=new Map<string,{created:number;expires:number;promise:Promise<Snapshot>}>();
export async function sharedSnapshot(key:string,ttlSeconds:number,load:()=>Promise<Response>):Promise<Response>{
 let entry=entries.get(key);
 if(!entry||Date.now()>=entry.expires){
  const promise=Promise.resolve().then(load).then(async response=>({body:await response.text(),status:response.status,statusText:response.statusText,headers:[...response.headers.entries()],ok:response.ok}));
  const current={created:Date.now(),expires:Infinity,promise};
  entry=current;entries.set(key,current);
  current.promise=current.promise.then(snapshot=>{current.expires=Date.now()+(snapshot.ok?ttlSeconds:5)*1000;return snapshot;},error=>{if(entries.get(key)===current)entries.delete(key);throw error;});
 }
 const snapshot=await entry.promise;
 const headers=new Headers(snapshot.headers);
 if(snapshot.ok)headers.set('Age',String(Math.max(0,Math.floor((Date.now()-entry.created)/1000))));
 return new Response(snapshot.body,{status:snapshot.status,statusText:snapshot.statusText,headers});
}
