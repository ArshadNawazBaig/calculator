// Reuse formatters across long result tables instead of creating one per cell.
const formatters=new Map<string,Intl.NumberFormat>();
function formatter(currency:string|undefined,digits:number){
 const key=(currency||'number')+':'+digits;
 let value=formatters.get(key);
 if(!value){value=new Intl.NumberFormat('en-US',currency?{style:'currency',currency,minimumFractionDigits:digits,maximumFractionDigits:digits}:{maximumFractionDigits:digits});if(formatters.size>100)formatters.clear();formatters.set(key,value);}
 return value;
}
export const money=(n:number,currency='USD',digits=2)=>formatter(currency,digits).format(n);
export const number=(n:number,digits=4)=>n!==0&&(Math.abs(n)<10**(-digits)||Math.abs(n)>=1e15)?n.toExponential(Math.min(digits,8)):formatter(undefined,digits).format(n);
