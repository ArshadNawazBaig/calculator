"use client";
import {useI18n} from "@/components/i18n/provider";
import {useId,useRef} from 'react';
import {Search,X} from 'lucide-react';
import styles from './category-search.module.css';

type CategorySearchProps={
  query:string;
  onQueryChange:(query:string)=>void;
  resultsId:string;
};

export function CategorySearch({query,onQueryChange,resultsId}:CategorySearchProps){
 const {t,locale}=useI18n();

  const id=useId();
  const inputRef=useRef<HTMLInputElement>(null);
  return <div className={styles.root}>
    <Search size={17} aria-hidden="true"/>
    <label className="sr-only" htmlFor={id}>{locale==='en'?'Filter calculators':t("Search calculators")}</label>
    <input ref={inputRef} id={id} type="search" placeholder={t("Search calculators…")} value={query}
      autoComplete="off" spellCheck={false} aria-controls={resultsId}
      onChange={event=>onQueryChange(event.target.value)}
      onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();onQueryChange('');}}}/>
    {query&&<button type="button" aria-label={locale==='en'?'Clear filter':t("Clear search")} onClick={()=>{onQueryChange('');inputRef.current?.focus();}}><X size={16} aria-hidden="true"/></button>}
  </div>;
}
