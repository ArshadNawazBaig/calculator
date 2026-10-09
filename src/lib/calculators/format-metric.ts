import type {Metric} from './types';
import {money,number} from '@/lib/format';
export function formatMetric(metric:Metric,currency='USD',locale='en-US'){if(typeof metric.value==='string')return metric.value;const value=metric.format==='money'?money(metric.value,currency,metric.digits??2,locale):number(metric.value,metric.digits??6,locale);return `${value}${metric.format==='percent'?'%':''}${metric.unit?' '+metric.unit:''}`;}
