// Reuse formatters across long result tables instead of creating one per cell.
const formatters=new Map<string,Intl.NumberFormat>();
function formatter(currency:string|undefined,digits:number|undefined,locale='en-US',scientific=false,useGrouping=true){
 // Make Arabic digits consistent across server and browser CLDR versions.
 if(locale==='ar')locale='ar-u-nu-arab';
 const key=locale+':'+(currency||'number')+':'+digits+':'+scientific+':'+useGrouping;
 let value=formatters.get(key);
 if(!value){value=new Intl.NumberFormat(locale,currency?{style:'currency',currency,minimumFractionDigits:digits,maximumFractionDigits:digits}:{maximumFractionDigits:digits,notation:scientific?'scientific':'standard',useGrouping});if(formatters.size>100)formatters.clear();formatters.set(key,value);}
 return value;
}
export const resultDigits=2;
export function currencyDigits(currency='USD',locale='en-US') {
 return Math.min(resultDigits,formatter(currency,undefined,locale).resolvedOptions().maximumFractionDigits??2);
}
export function money(n:number,currency='USD',digits?:number,locale='en-US') {
 digits=Math.min(digits??currencyDigits(currency,locale),resultDigits);
 return formatter(currency,digits,locale).format(Math.abs(n)<.5*10**(-digits)?0:n);
}
export function number(n:number,digits=resultDigits,locale='en-US',useGrouping=true) {
 digits=Math.min(digits,resultDigits);
 // Keep tiny nonzero quantities visible without long decimal tails.
 if(n!==0&&(Math.abs(n)<10**(-digits)||Math.abs(n)>=1e15)) {
  return formatter(undefined,digits,locale,true,useGrouping).format(n);
 }
 return formatter(undefined,digits,locale,false,useGrouping).format(n===0?0:n);
}
