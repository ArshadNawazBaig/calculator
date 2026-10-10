import Decimal from 'decimal.js';
import {metric as m,type Result} from './types';

/** Retain the equation's full result, but present only achievable scores as score targets. */
export function finalGrade(current:number,target:number,weightPercent:number,label:string):Result {
 const weight=new Decimal(weightPercent).div(100);
 const earned=new Decimal(current).times(new Decimal(1).minus(weight));
 const required=new Decimal(target).minus(earned).div(weight);
 const impossible=required.gt(100),secured=required.lt(0);
 const displayValue=impossible?'Target not attainable':secured?'Target already secured':undefined;
 return {
  metrics:[
   {...m(label,required.toNumber(),'percent'),displayValue},
   ...(secured?[m('Minimum nonnegative score',0,'percent')]:[]),
   m('Highest possible overall grade',earned.plus(weight.times(100)).toNumber(),'percent'),
  ],
  notes:impossible?['The target requires more than 100% on the remaining assessment. Lower the target or check whether extra credit is available.']:secured?['The target is met even with a 0% score on the remaining assessment under these weights. Course completion rules may still apply.']:[],
 };
}
