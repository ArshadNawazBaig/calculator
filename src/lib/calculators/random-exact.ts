import Decimal from 'decimal.js';
import {integer,num} from './helpers';
import {metric,type Values,type Result} from './types';
const D=Decimal.clone({precision:7000});
type RandomBytes=(bytes:Uint8Array)=>void;
const randomBytes:RandomBytes=bytes=>{globalThis.crypto.getRandomValues(bytes);};

export function randomBelow(range:bigint,fill:RandomBytes=randomBytes):bigint{
  if(range<1n)throw Error('The random range must be positive.');
  if(range===1n)return 0n;
  const bits=(range-1n).toString(2).length,bytes=new Uint8Array(Math.ceil(bits/8)),mask=255 >>> (bytes.length*8-bits);
  for(let attempt=0;attempt<10000;attempt++){
    fill(bytes);bytes[0]&=mask;let value=0n;
    for(const byte of bytes)value=(value<<8n)|BigInt(byte);
    if(value<range)return value;
  }
  throw Error('The random source could not produce a valid sample. Try again.');
}

export function exactRandom(values:Values,fill:RandomBytes=randomBytes):Result{
  const places=values.kind==='decimal'?integer(num(values,'places'),0,999):0,count=integer(num(values,'count'),1,1000);
  function bound(text:string){
    if(text.length>5500||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(text))throw Error('Use a numeric bound with at most 5,500 characters.');
    const value=new D(text);if(!value.isFinite()||Math.abs(value.e)>5000)throw Error('Bound exponents must be within ±5,000.');
    if(values.kind==='integer'&&!value.isInteger())throw Error('Whole-number mode needs integer bounds.');
    return value;
  }
  const lower=bound(values.min),upper=bound(values.max);
  if(upper.lt(lower))throw Error('Maximum cannot be below minimum.');
  const scale=new D(10).pow(places),lo=BigInt(lower.mul(scale).ceil().toFixed(0)),hi=BigInt(upper.mul(scale).floor().toFixed(0)),range=hi-lo+1n;
  if(range<1n)throw Error('The bounds contain no number at the chosen decimal precision.');
  if(values.replacement==='no'&&BigInt(count)>range)throw Error('There are not enough distinct values in this range.');
  if(count*(Math.max(1,lower.e+1,upper.e+1)+places+4)>1_000_000)throw Error('This request exceeds one million output characters. Reduce the count or precision.');
  const valuesOut:bigint[]=[],swaps=new Map<bigint,bigint>();
  for(let i=0;i<count;i++){
    if(values.replacement==='no'){
      const remaining=range-BigInt(i),index=randomBelow(remaining,fill),picked=swaps.get(index)??index,last=remaining-1n;
      swaps.set(index,swaps.get(last)??last);swaps.delete(last);valuesOut.push(lo+picked);
    }else valuesOut.push(lo+randomBelow(range,fill));
  }
  if(values.sort==='ascending'||values.sort==='descending')valuesOut.sort((a,b)=>(a<b?-1:a>b?1:0)*(values.sort==='descending'?-1:1));
  const format=(value:bigint)=>{
    if(!places)return value.toString();const text=(value<0n?-value:value).toString().padStart(places+1,'0');
    return `${value<0n?'-':''}${text.slice(0,-places)}.${text.slice(-places)}`;
  };
  return {metrics:[metric('Random numbers',valuesOut.map(format).join(', '))],notes:['Bounds are inclusive. Decimal mode samples uniformly from the fixed grid at the selected decimal places. Crypto random bytes are sampled without modulo bias.']};
}
