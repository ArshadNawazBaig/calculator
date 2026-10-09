"use client";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {categories} from "@/lib/site";
import {searchCalculators} from "@/lib/calculator-search";
import {ToolDirectory} from "./tool-directory";
import {Search} from "@/components/search";

export function SearchResults() {
  const params=useSearchParams(),query=params.get("q")?.trim()||"",category=categories.find(c=>c.id===params.get("category"));
  const results=searchCalculators(query,category?.id);
  return <><Search key={`${query}-${category?.id}`} initialQuery={query} category={category?.id}/>
    {query&&<h2 className="mt-8 mb-4 text-xl font-semibold">Results for “{query}”</h2>}
    {category&&<p className="search-count">Searching in {category.name.toLowerCase()}. <Link className="text-link" href={`/search?q=${encodeURIComponent(query)}`}>Search all categories</Link></p>}
    {query?<><p className="search-count">{results.length} {results.length===1?"tool":"tools"} found</p>{results.length?<ToolDirectory tools={results} grouped={false}/>:<div className="availability-panel"><h2>No matching calculators</h2><p>Try a shorter phrase such as “mortgage”, “interest”, “date”, or “percentage”.</p><Link href="/calculators" className="text-link">Browse all calculators</Link></div>}</>:<p>Search by name or browse the calculator directory.</p>}
  </>;
}
