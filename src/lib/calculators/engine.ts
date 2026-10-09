import {parseRows} from './row-data';
import type {ExpressionContext} from './expression-engine';
import {prepareMathInputs,mathOutputUnits} from './math-inputs';
import {isFieldActive} from "./field-visibility";
import type {CategoryId} from "@/lib/site";
import type {Mode,Result,Values} from "./types";
export async function calculate(category:CategoryId,mode:Mode,values:Values,context:ExpressionContext={}):Promise<Result>{
 values={...values};if(mode.algorithm==='molecular-weight'&&values.preset&&values.preset!=='custom')values.formula=values.preset;for(const field of mode.fields){if(!isFieldActive(mode,field,values)){values[field.key]=field.default;continue;}const v=values[field.key]??"";if(!field.optional&&!v.trim())throw new Error(`${field.label} is required.`);if(field.type==='rows')for(const row of parseRows(v,field.label)){if(Object.values(row).some(value=>!['string','number','boolean'].includes(typeof value)))throw Error(`${field.label} rows must contain simple text or numeric values.`);}if(field.type==="number"&&v.trim()){const n=Number(v);if(!Number.isFinite(n))throw new Error(`${field.label} must be a finite number.`);if(field.min!==undefined&&n<field.min)throw new Error(`${field.label} must be at least ${field.min}.`);if(field.max!==undefined&&n>field.max)throw new Error(`${field.label} must be at most ${field.max}.`);}if(field.options&&field.type==="multiselect"&&v.split(",").filter(Boolean).some(value=>!field.options!.some(o=>o.value===value)))throw new Error(`Select valid ${field.label.toLowerCase()}.`);if(field.options&&field.type!=="multiselect"&&!field.options.some(o=>o.value===v))throw new Error(`Select a valid ${field.label.toLowerCase()}.`);}
 if(category==='everyday'&&['base64','base64-charset'].includes(mode.algorithm))return (await import('./base64-codec')).runBase64Text(values);
 const engine=category==="math"?await import("./math-engine"):category==="finance"?await import("./finance-engine"):category==="health"?await import("./health-engine"):await import("./everyday-engine");
 const r=await engine.run(mode.algorithm,category==="math"?prepareMathInputs(mode,values):values,context);
 for(const value of [...r.metrics.map(m=>m.value),...(r.table?.rows.flat()||[]),...(r.chart?.map(p=>p.value)||[])])if(typeof value==="number"&&!Number.isFinite(value))throw new Error("These inputs do not produce a finite result. Check the values and formula limits.");
 return category==="math"?mathOutputUnits(r,values.outputUnit):r;
}
