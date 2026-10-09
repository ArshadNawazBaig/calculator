"use client";
import {useI18n} from "@/components/i18n/provider";
import {useId,useMemo,useState} from 'react';
import type {CatalogEntry} from '@/lib/calculators/types';
import {categoryLabels,type CategoryId} from '@/lib/site';
import {CategorySearch} from './category-search';
import {ToolDirectory} from './tool-directory';

function normalize(value:string){
  return value.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}

export function FilterableToolDirectory({tools,category,grouped=true}:{tools:CatalogEntry[];category:CategoryId;grouped?:boolean}){
 const {t,messages}=useI18n();

  const [query,setQuery]=useState('');
  const resultsId=useId();
  const filteredTools=useMemo(()=>{
    const terms=normalize(query).split(' ').filter(Boolean);
    if(!terms.length)return tools;
    return tools.filter(tool=>{
      const name=normalize(`${tool.title} ${tool.slug} ${messages[`tool.${tool.slug}`]||''}`);
      return terms.every(term=>name.includes(term));
    });
  },[query,tools,messages]);

  return <>
    <section aria-labelledby={`${resultsId}-title`} className="mb-8 flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-center md:justify-between print:hidden">
      <div>
        <h2 id={`${resultsId}-title`} className="text-base font-semibold tracking-tight">{t("Search {category} calculators",{category:t(categoryLabels[category]).toLowerCase()})}</h2>
        <p className="mt-1 text-xs text-muted" role="status" aria-atomic="true">
          {query.trim()?t("{shown} of {total}",{shown:filteredTools.length,total:tools.length}):t("Results: {count}",{count:tools.length})}
        </p>
      </div>
      <CategorySearch query={query} onQueryChange={setQuery} resultsId={resultsId}/>
    </section>
    <div id={resultsId}>
      {filteredTools.length?<ToolDirectory tools={filteredTools} grouped={grouped}/>:<div className="rounded-lg border border-line bg-surface px-5 py-8">
        <h2 className="text-base font-semibold">{t("No matching calculators")}</h2>
        <p className="mt-2 text-sm text-muted">{t("Try another name or clear the search field.")}</p>
      </div>}
    </div>
  </>;
}
