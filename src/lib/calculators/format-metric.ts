import type {Metric} from './types';
import Decimal from 'decimal.js';
import {money,number} from '@/lib/format';
function numericToken(value:string,digits:number|undefined,locale:string) {
 const parsed=Number(value);
 if(Number.isFinite(parsed)&&(parsed!==0||new Decimal(value).isZero()))return number(parsed,digits,locale,false);
 // Decimal-backed unit conversions may exceed the Number range in either direction.
 const [coefficient,exponent]=new Decimal(value).toExponential(Math.min(digits??2,2)).split('e');
 return `${number(Number(coefficient),digits,locale,false)}E${number(Number(exponent),0,locale,false)}`;
}
export function formatMetric(metric:Metric,currency='USD',locale='en-US',translate=(value:string)=>value) {
 if(metric.displayValue)return translate(metric.displayValue);
 if(typeof metric.value==='string') {
  // Only engine-owned approximate numeric text opts in. Exact answers and user text stay intact.
  if(metric.numericText)return metric.value.replace(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi,value=>(value.startsWith('+')?'+':'')+numericToken(value,metric.digits,locale))+(metric.unit?' '+metric.unit:'');
  return metric.translateValue?translate(metric.value):metric.value;
 }
 const value=metric.format==='money'?money(metric.value,currency,metric.digits,locale):number(metric.value,metric.digits,locale);
 return `${value}${metric.format==='percent'?'%':''}${metric.unit?' '+metric.unit:''}`;
}
