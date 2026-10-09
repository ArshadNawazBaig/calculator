// Reuse formatters across long result tables instead of creating one per cell.
const formatters=new Map<string,Intl.NumberFormat>();
function formatter(currency:string|undefined,digits:number,locale='en-US'){
 // Make Arabic digits consistent across server and browser CLDR versions.
 if(locale==='ar')locale='ar-u-nu-arab';
 const key=locale+':'+(currency||'number')+':'+digits;
 let value=formatters.get(key);
 if(!value){value=new Intl.NumberFormat(locale,currency?{style:'currency',currency,minimumFractionDigits:digits,maximumFractionDigits:digits}:{maximumFractionDigits:digits});if(formatters.size>100)formatters.clear();formatters.set(key,value);}
 return value;
}
export const money=(n:number,currency='USD',digits=2,locale='en-US')=>formatter(currency,digits,locale).format(n);
export const number=(n:number,digits=4,locale='en-US')=>n!==0&&(Math.abs(n)<10**(-digits)||Math.abs(n)>=1e15)?n.toExponential(Math.min(digits,8)):formatter(undefined,digits,locale).format(n);
