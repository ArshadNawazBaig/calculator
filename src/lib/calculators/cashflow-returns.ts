import {exponentialRoots} from './financial-roots';
export function cashflowRoots(flows:{time:number;amount:number}[]){
 const grouped=new Map<number,number>();for(const flow of flows)grouped.set(flow.time,(grouped.get(flow.time)||0)+flow.amount);const effective=[...grouped].filter(([,amount])=>amount!==0).map(([time,amount])=>({time,amount}));
 if(!effective.length)return {status:'indeterminate',roots:[] as number[]};
 if(!effective.some(f=>f.amount>0)||!effective.some(f=>f.amount<0))return {status:'no-root-in-range',roots:[] as number[]};
 const roots=exponentialRoots(effective).map(log=>Math.expm1(log));
 return {status:roots.length>1?'multiple-roots':roots.length===1?'one-root-in-range':'no-root-in-range',roots};
}
export function payback(flows:number[],discount=0){let total=flows[0];if(total>=0)return 0;for(let i=1;i<flows.length;i++){const flow=flows[i]/(1+discount)**i;if(total+flow>=0&&flow>0)return i-1-total/flow;total+=flow;}return null;}
