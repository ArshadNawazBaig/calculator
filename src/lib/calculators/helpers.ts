import type {Values,Result,Metric} from "./types";
export function num(v:Values,k:string,fallback?:number){const raw=v[k];if(raw==null||raw.trim()===""){if(fallback!==undefined)return fallback;throw new Error(`Enter ${k.replaceAll("_"," ")}.`);}const x=Number(raw);if(!Number.isFinite(x))throw new Error(`Enter a finite number for ${k.replaceAll("_"," ")}.`);return x;}
export function positive(x:number,label="Value"){if(!(x>0))throw new Error(`${label} must be greater than zero.`);return x;}
export function nonnegative(x:number,label="Value"){if(x<0)throw new Error(`${label} cannot be negative.`);return x;}
export function integer(x:number,min=0,max=1000000){if(!Number.isSafeInteger(x)||x<min||x>max)throw new Error(`Enter a whole number between ${min} and ${max}.`);return x;}
export function list(text:string){const parts=text.trim().split(/[\s,;]+/).filter(Boolean);if(parts.length>10000)throw new Error("Use no more than 10,000 values.");const a=parts.map(Number);if(!text.trim()||a.some(n=>!Number.isFinite(n)))throw new Error("Enter numbers separated by commas or spaces.");return a;}
export function gcd(a:number,b:number):number{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}return a;}
export function factorial(n:number):number{integer(n,0,170);let r=1;for(let i=2;i<=n;i++)r*=i;return r;}
export function choose(n:number,r:number){integer(n,0,1000);integer(r,0,n);r=Math.min(r,n-r);let x=1;for(let i=1;i<=r;i++)x=x*(n-i+1)/i;return x;}
export function summarize(a:number[]){const sorted=[...a].sort((x,y)=>x-y),count=a.length,sum=a.reduce((x,y)=>x+y,0),mean=sum/count,ss=a.reduce((s,x)=>s+(x-mean)**2,0);const median=count%2?sorted[(count-1)/2]:(sorted[count/2-1]+sorted[count/2])/2;const freq=new Map<number,number>();a.forEach(x=>freq.set(x,(freq.get(x)||0)+1));const maxCount=Math.max(...freq.values());const modes=maxCount===1?[]:[...freq].filter(([,n])=>n===maxCount).map(([x])=>x);return {count,sum,mean,median,min:sorted[0],max:sorted.at(-1)!,range:sorted.at(-1)!-sorted[0],variance:ss/count,sampleVariance:count>1?ss/(count-1):NaN,modes};}
export {normalCdf,normalSf,inverseNormalCdf as invNormal} from "./normal";
export function solveRoot(fn:(x:number)=>number,lo:number,hi:number){let fl=fn(lo);if(fl===0)return lo;let fh=fn(hi);if(fh===0)return hi;if(!Number.isFinite(fl)||!Number.isFinite(fh)||fl*fh>0)throw new Error("No solution was found in the supported range. Check the inputs.");for(let i=0;i<150;i++){const mid=(lo+hi)/2,fm=fn(mid);if(Math.abs(fm)<1e-10)return mid;if(fl*fm<=0){hi=mid;fh=fm;}else{lo=mid;fl=fm;}}return (lo+hi)/2;}
export function result(...metrics:Metric[]):Result{return {metrics};}
export const round=(x:number,d=2)=>Math.round((x+Number.EPSILON)*10**d)/10**d;
export function dateUTC(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw new Error("Enter a complete date.");const d=new Date(`${s}T00:00:00Z`);if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s)throw new Error("Enter a valid date.");return d;}
export const isoDate=(d:Date)=>{if(!Number.isFinite(d.getTime())||d.getUTCFullYear()<1||d.getUTCFullYear()>9999)throw Error("Result date must be between years 0001 and 9999.");return d.toISOString().slice(0,10);};
export const dayMs=86400000;
