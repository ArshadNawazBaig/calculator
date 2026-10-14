"use client";
import {useI18n} from "@/components/i18n/provider";
import Link from "@/components/i18n/link";
import {useSearchParams} from "next/navigation";
import {toolCategories as categories} from "@/lib/site";
import {searchCalculators} from "@/lib/calculator-search";
import {ToolDirectory} from "./tool-directory";
import {Search} from "@/components/search";

export function SearchResults() {
 const {t,messages}=useI18n();

  const params=useSearchParams(),query=params.get("q")?.trim()||"",category=categories.find(c=>c.id===params.get("category"));
  const results=searchCalculators(query,category?.id,messages);
  return <><Search key={`${query}-${category?.id}`} initialQuery={query} category={category?.id}/>
    {query&&<h2 className="mt-8 mb-4 text-xl font-semibold">{t("Results for “{query}”",{query})}</h2>}
    {category&&<p className="search-count">{t("Searching in {category}.",{category:t(category.name).toLowerCase()})} <Link className="text-link" href={`/search?q=${encodeURIComponent(query)}`}>{t("Search all categories")}</Link></p>}
    {query?<><p className="search-count">{t("Results: {count}",{count:results.length})}</p>{results.length?<ToolDirectory tools={results} grouped={false}/>:<div className="availability-panel"><h2>{t("No matching calculators")}</h2><p>{t("Try a shorter name, such as “loan” or “date”.")}</p><Link href="/calculators" className="text-link">{t("Browse all calculators")}</Link></div>}</>:<p>{t("Search by name or browse the calculator directory.")}</p>}
  </>;
}
