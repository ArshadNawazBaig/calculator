/** Bounded numerical search in log(1+r). Returned roots do not establish uniqueness outside the search interval. */
export function rateRoots(evaluate:(logGrowth:number)=>number,minimum=-12,maximum=8){
 const roots:number[]=[],steps=4000;
 const add=(x:number)=>{if(Number.isFinite(x)&&!roots.some(r=>Math.abs(r-x)<1e-7))roots.push(x);};
 let previous=minimum,previousValue=evaluate(previous);
 for(let step=1;step<=steps;step++){
  const x=minimum+(maximum-minimum)*step/steps,value=evaluate(x);
  if(value===0)add(x);
  if(Number.isFinite(value)&&Number.isFinite(previousValue)&&value*previousValue<0){let lo=previous,hi=x,lowValue=previousValue;for(let j=0;j<100;j++){const mid=(lo+hi)/2,f=evaluate(mid);if(!Number.isFinite(f))break;if(f===0){lo=hi=mid;break;}if(Math.sign(f)===Math.sign(lowValue)){lo=mid;lowValue=f;}else hi=mid;}add((lo+hi)/2);}
  previous=x;previousValue=value;
 }
 return roots;
}
export const presentAnnuity=(rate:number,periods:number)=>rate===0?periods:-Math.expm1(-periods*Math.log1p(rate))/rate;
export const futureAnnuity=(rate:number,periods:number)=>rate===0?periods:Math.expm1(periods*Math.log1p(rate))/rate;

/** Isolate exponential-polynomial roots using derivative critical points, including even-multiplicity roots. */
export function exponentialRoots(input:{time:number;amount:number}[],minimum=-12,maximum=8):number[]{
 const combined=new Map<number,number>();for(const term of input)combined.set(term.time,(combined.get(term.time)||0)+term.amount);
 const terms=[...combined].filter(([,amount])=>amount!==0).sort((a,b)=>a[0]-b[0]);
 if(terms.length<2)return [];
 const start=terms[0][0],scale=Math.max(...terms.map(([,amount])=>Math.abs(amount))),normalized=terms.map(([time,amount])=>({time:time-start,amount:amount/scale}));
 let variations=0;for(let i=1;i<normalized.length;i++)if(Math.sign(normalized[i].amount)!==Math.sign(normalized[i-1].amount))variations++;
 if(!variations)return [];
 const evaluate=(x:number)=>{const shift=x<0?-normalized.at(-1)!.time*x:0;let sum=0,absolute=0;for(const term of normalized){const value=term.amount*Math.exp(-term.time*x-shift);sum+=value;absolute+=Math.abs(value);}return {sum,absolute};};
 const critical=variations>1?exponentialRoots(normalized.slice(1).map(term=>({time:term.time,amount:-term.time*term.amount})),minimum,maximum):[];
 const points=[minimum,...critical,maximum],roots:number[]=[];
 const add=(x:number)=>{if(!roots.some(r=>Math.abs(r-x)<1e-10))roots.push(x);};
 for(const x of points){const {sum,absolute}=evaluate(x);if(Math.abs(sum)<=32*Number.EPSILON*absolute)add(x);}
 for(let index=1;index<points.length;index++){
  let lo=points[index-1],hi=points[index],low=evaluate(lo).sum,high=evaluate(hi).sum;
  if(roots.some(root=>Math.abs(root-lo)<1e-10||Math.abs(root-hi)<1e-10)||Math.sign(low)===Math.sign(high)||low===0||high===0)continue;
  for(let i=0;i<100;i++){const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;const value=evaluate(mid).sum;if(value===0){lo=hi=mid;break;}if(Math.sign(value)===Math.sign(low)){lo=mid;low=value;}else {hi=mid;high=value;}}
  add((lo+hi)/2);
 }
 return roots.sort((a,b)=>a-b);
}
