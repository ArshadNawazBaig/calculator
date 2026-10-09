"use client";
import {useId,useMemo,useState} from 'react';
import type {CatalogEntry} from '@/lib/calculators/types';
import {categoryLabels,type CategoryId} from '@/lib/site';
import {CategorySearch} from './category-search';
import {ToolDirectory} from './tool-directory';

function normalize(value:string){
  return value.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}

export function FilterableToolDirectory({tools,category,grouped=true}:{tools:CatalogEntry[];category:CategoryId;grouped?:boolean}){
  const [query,setQuery]=useState('');
  const resultsId=useId();
  const filteredTools=useMemo(()=>{
    const terms=normalize(query).split(' ').filter(Boolean);
    if(!terms.length)return tools;
    return tools.filter(tool=>{
      const name=normalize(`${tool.title} ${tool.slug}`);
      return terms.every(term=>name.includes(term));
    });
  },[query,tools]);

  return <>
    <section aria-labelledby={`${resultsId}-title`} className="mb-8 flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-center md:justify-between print:hidden">
      <div>
        <h2 id={`${resultsId}-title`} className="text-base font-semibold tracking-tight">Search {categoryLabels[category].toLowerCase()} calculators</h2>
        <p className="mt-1 text-xs text-muted" role="status" aria-atomic="true">
          {query.trim()?`${filteredTools.length} of ${tools.length}`:tools.length} {tools.length===1?'calculator':'calculators'}
        </p>
      </div>
      <CategorySearch query={query} onQueryChange={setQuery} resultsId={resultsId}/>
    </section>
    <div id={resultsId}>
      {filteredTools.length?<ToolDirectory tools={filteredTools} grouped={grouped}/>:<div className="rounded-lg border border-line bg-surface px-5 py-8">
        <h2 className="text-base font-semibold">No matching calculators</h2>
        <p className="mt-2 text-sm text-muted">Try another name or clear the search field.</p>
      </div>}
    </div>
  </>;
}
