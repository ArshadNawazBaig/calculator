'use client';
import {useState} from 'react';
import type {Field} from '@/lib/calculators/types';
export function SearchableSelect({field,value,onChange,id,disabled}:{field:Field;value:string;onChange:(value:string)=>void;id:string;disabled:boolean}){
 const [query,setQuery]=useState('');const all=field.options||[],matches=all.filter(option=>option.label.toLowerCase().includes(query.trim().toLowerCase())),selected=all.find(option=>option.value===value),options=selected&&!matches.includes(selected)?[selected,...matches]:matches;
 return <div className="searchable-select"><label className="sr-only" htmlFor={`${id}-filter`}>Filter {field.label.toLowerCase()}</label><input id={`${id}-filter`} type="search" placeholder="Filter by name, category or code…" value={query} onChange={e=>setQuery(e.target.value)} disabled={disabled} autoComplete="off" aria-controls={id}/><select id={id} name={field.key} value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} required={!field.optional} aria-describedby={`${id}-matches`}>{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select><p id={`${id}-matches`} role="status">{matches.length} matching options{selected&&!matches.includes(selected)?'; current selection retained':''}.</p></div>;
}
