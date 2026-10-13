"use client";
import {RecordCsvControls} from './record-csv-controls';
import {currencyLabel} from '@/lib/i18n/preferences';
import {useI18n} from "@/components/i18n/provider";
import {Plus,Trash2} from 'lucide-react';
import {Dropdown} from '@/components/ui/dropdown';
import {Button} from '@/components/ui/button';
import {DatePicker} from '@/components/ui/date-picker';
import type {Field} from '@/lib/calculators/types';

export function RecordRows({field,value,onChange,id,disabled,currency}:{currency?:string;field:Field;value:string;onChange:(value:string)=>void;id:string;disabled:boolean}){
 const {t}=useI18n();
 const text=(label:string)=>currency?currencyLabel(label,currency,t):t(label);

  let rows:Record<string,string>[]=[];
  try{const parsed=JSON.parse(value);if(Array.isArray(parsed)&&parsed.length<=100&&parsed.every(row=>row&&typeof row==='object'&&!Array.isArray(row)&&Object.values(row).every(v=>['string','number','boolean'].includes(typeof v))))rows=parsed.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,typeof value==='boolean'?(value?'yes':'no'):String(value)])));}catch{/* Calculation validation explains invalid row data. */}
  const columns=field.rowColumns||[];
  const update=(index:number,key:string,next:string)=>onChange(JSON.stringify(rows.map((row,i)=>i===index?{...row,[key]:next}:row)));
  return <fieldset className="record-editor" disabled={disabled} aria-describedby={field.hint?`${id}-hint`:undefined}><legend>{text(field.label)}</legend>
    {rows.map((row,index)=><div className="record-row" key={index}><span className="record-number">{index+1}</span><div className="record-cells">{columns.map(column=>{
      const inputId=`${id}-${index}-${column.key}`;
      const current=row[column.key]??column.default??'';
      const controlProps={id:inputId,value:current,onValueChange:(next:string)=>update(index,column.key,next),disabled,'aria-labelledby':`${inputId}-label`};
      return <div className="record-cell" key={column.key}>{column.type!=='date'&&<label id={`${inputId}-label`} htmlFor={inputId}>{text(column.label)}</label>}
        {column.type==='select'?<Dropdown {...controlProps} options={(column.options??[]).map(option=>({...option,label:text(option.label)}))}/>:column.type==='date'?<DatePicker {...controlProps} aria-labelledby={undefined} label={text(column.label)}/>:<input id={inputId} value={current} onChange={event=>update(index,column.key,event.target.value)} type={column.type||'text'} step="any" autoComplete="off"/>}
      </div>;
    })}</div><Button type="button" variant="ghost" className="record-remove" aria-label={t("Remove row {count}",{count:index+1})} onClick={()=>onChange(JSON.stringify(rows.filter((_,i)=>i!==index)))}><Trash2 size={16} aria-hidden="true"/></Button></div>)}
    <Button type="button" variant="secondary" disabled={rows.length>=100} onClick={()=>onChange(JSON.stringify([...rows,Object.fromEntries(columns.map(c=>[c.key,c.default??'']))]))}><Plus size={16} aria-hidden="true"/> {t("Add row")}</Button>
    {field.csv&&<RecordCsvControls key={value} field={field} disabled={disabled} onChange={onChange}/>}
  </fieldset>;
}
