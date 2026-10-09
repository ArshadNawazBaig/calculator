import {Dropdown} from '@/components/ui/dropdown';
import {DatePicker} from '@/components/ui/date-picker';
import {RecordRows} from './record-rows';
import type {Field} from '@/lib/calculators/types';

export function CalculatorField({field,value,onChange,prefix,disabled=false}:{field:Field;value:string;onChange:(value:string)=>void;prefix:string;disabled?:boolean}){
  const id=`${prefix}-${field.key}`;
  const describedBy=field.hint?`${id}-hint`:undefined;
  const common={id,name:field.key,value,required:!field.optional,disabled,'aria-describedby':describedBy,onChange:(event:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>onChange(event.target.value)};
  if(field.type==='rows')return <div className="calculator-field field-wide"><RecordRows field={field} value={value} onChange={onChange} id={id} disabled={disabled}/>{field.hint&&<p id={`${id}-hint`}>{field.hint}</p>}</div>;
  if(field.type==='multiselect'){
    const selected=value.split(',').filter(Boolean);
    return <fieldset className="calculator-field field-wide checkbox-options" disabled={disabled}><legend>{field.label}</legend>{field.options?.map(option=><label key={option.value}><input type="checkbox" checked={selected.includes(option.value)} onChange={event=>onChange((event.target.checked?[...selected,option.value]:selected.filter(v=>v!==option.value)).join(','))}/>{option.label}</label>)}{field.hint&&<p>{field.hint}</p>}</fieldset>;
  }
  const controlProps={id,name:field.key,value,onValueChange:onChange,required:!field.optional,disabled,'aria-labelledby':`${id}-label`,'aria-describedby':describedBy};
  return <div className={`calculator-field ${field.type==='textarea'?'field-wide':''}`}>
    {field.type!=='date'&&<label id={`${id}-label`} htmlFor={id}>{field.label}{field.unit&&<span>{field.unit}</span>}</label>}
    {field.type==='select'?<Dropdown {...controlProps} options={field.options??[]}/>:field.type==='date'?<DatePicker {...controlProps} aria-labelledby={undefined} label={field.label}/>:field.type==='textarea'?<textarea {...common} rows={4} spellCheck={false}/>:<input {...common} type={field.type} min={field.min} max={field.max} step={field.step||'any'} autoComplete="off"/>}
    {field.hint&&<p id={`${id}-hint`}>{field.hint}</p>}
  </div>;
}
