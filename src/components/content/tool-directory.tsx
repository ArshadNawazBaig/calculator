"use client";
import {useI18n} from "@/components/i18n/provider";
import Link from "@/components/i18n/link";
import {categorySlug} from "@/lib/catalog-paths";
import {CalculatorCard} from "@/components/calculators/calculator-card";
import {calculatorCardData} from "@/lib/calculator-cards";
import type {ToolListing} from "@/lib/tool-listings";

export function ToolDirectory({tools,grouped=true}:{tools:ToolListing[];grouped?:boolean}) {
 const {t}=useI18n();

  const groups=grouped?[...new Set(tools.map(tool=>tool.subcategory))]:[""];
  return <div className="directory-groups">{groups.map(group=>{
    const category=tools.find(tool=>tool.subcategory===group)?.category;
    return <section key={group} id={group?`${category}-${categorySlug(group)}`:undefined}>
      {group&&<h2><Link href={category==='spin-wheels'?'/spin-wheels':`/calculators/${category}/${categorySlug(group)}`}>{t(group)}</Link></h2>}
      <div className="directory-grid">{tools.filter(tool=>!group||tool.subcategory===group).map(tool=><CalculatorCard key={tool.slug} tool={calculatorCardData(tool)}/>)}</div>
    </section>;
  })}</div>;
}
