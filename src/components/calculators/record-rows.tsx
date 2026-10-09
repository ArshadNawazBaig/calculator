import {Plus, Trash2} from 'lucide-react';
import type {Field} from '@/lib/calculators/types';

export function RecordRows({field,value,onChange,id,disabled}:{field:Field;value:string;onChange:(value:string)=>void;id:string;disabled:boolean}){
 let rows:Record<string,string>[]=[];
 try{const parsed=JSON.parse(value);if(Array.isArray(parsed)&&parsed.length<=100&&parsed.every(row=>row&&typeof row==='object'&&!Array.isArray(row)&&Object.values(row).every(v=>['string','number','boolean'].includes(typeof v))))rows=parsed.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,typeof value==='boolean'?(value?'yes':'no'):String(value)])));}catch{/* An invalid shared value is explained by calculation validation. */}
 const columns=field.rowColumns||[];
 const update=(index:number,key:string,next:string)=>onChange(JSON.stringify(rows.map((row,i)=>i===index?{...row,[key]:next}:row)));
 return <fieldset className="record-editor" disabled={disabled} aria-describedby={field.hint?`${id}-hint`:undefined}><legend>{field.label}</legend>
  {rows.map((row,index)=><div className="record-row" key={index}><span className="record-number">{index+1}</span><div className="record-cells">{columns.map(column=>{const inputId=`${id}-${index}-${column.key}`,common={id:inputId,value:row[column.key]??column.default??'',onChange:(event:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>update(index,column.key,event.target.value)};return <label key={column.key} htmlFor={inputId}><span>{column.label}</span>{column.type==='select'?<select {...common}>{column.options?.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>:<input {...common} type={column.type||'text'} step="any" autoComplete="off"/>}</label>;})}</div><button type="button" className="record-remove" aria-label={`Remove ${field.label.toLowerCase()} row ${index+1}`} onClick={()=>onChange(JSON.stringify(rows.filter((_,i)=>i!==index)))}><Trash2 size={16}/></button></div>)}
  <button type="button" className="button button-secondary" disabled={rows.length>=100} onClick={()=>onChange(JSON.stringify([...rows,Object.fromEntries(columns.map(c=>[c.key,c.default??'']))]))}><Plus size={16}/> Add row</button>
 </fieldset>;
}
