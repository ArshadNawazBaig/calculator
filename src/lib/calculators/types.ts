import type {CategoryId} from "@/lib/site";
export type Values=Record<string,string>;
export type RowColumn={key:string;label:string;type?:"text"|"number"|"date"|"time"|"select";default?:string;options?:{label:string;value:string}[]};
export type Field={key:string;label:string;type:"number"|"select"|"textarea"|"text"|"date"|"time"|"rows"|"multiselect";default:string;unit?:string;min?:number;max?:number;step?:string;hint?:string;optional?:boolean;group?:string;translateOptions?:boolean;options?:{label:string;value:string}[];rowColumns?:RowColumn[]};
export type Mode={id:string;title:string;algorithm:string;fields:Field[];formula:string;explanation:string;notes?:string[]};
export type Definition={slug:string;description:string;modes:Mode[];sources:{title:string;url:string}[];notes?:string[];status?:"ready"|"limited";limitations?:string[];example?:string};
export type CatalogEntry={slug:string;title:string;category:CategoryId;subcategory:string;type:string;sourceUrl:string;observedFormCount:number};
export type Metric={label:string;value:number|string;format?:"number"|"money"|"percent";unit?:string;digits?:number};
export type Result={metrics:Metric[];explanation?:string;notes?:string[];table?:{headers:string[];rows:(number|string)[][];translateColumns?:number[]};chart?:{label:string;value:number}[]};
export const n=(key:string,label:string,value:number,unit?:string,min?:number,max?:number):Field=>({key,label,type:"number",default:String(value),unit,min,max,step:"any"});
export const t=(key:string,label:string,value:string,type:Field["type"]="text",hint?:string):Field=>({key,label,type,default:value,hint});
export const s=(key:string,label:string,options:(string|[string,string])[],value?:string):Field=>{const opts=options.map(o=>typeof o==="string"?{label:o,value:o}:{label:o[1],value:o[0]});return {key,label,type:"select",default:value||opts[0].value,options:opts};};
export const mode=(id:string,title:string,algorithm:string,fields:Field[],formula:string,explanation:string,notes?:string[]):Mode=>({id,title,algorithm,fields,formula,explanation,notes});
export const metric=(label:string,value:number|string,format:Metric["format"]="number",unit?:string):Metric=>({label,value,format,unit});
export function defaults(mode:Mode):Values{return Object.fromEntries(mode.fields.map(f=>[f.key,f.default]));}
