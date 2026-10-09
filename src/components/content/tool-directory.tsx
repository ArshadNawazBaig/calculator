import Link from "next/link";
import {categorySlug} from "@/lib/catalog-paths";
import {CalculatorCard} from "@/components/calculators/calculator-card";
import {calculatorCardData} from "@/lib/calculator-cards";
import type {CatalogEntry} from "@/lib/calculators/types";

export function ToolDirectory({tools,grouped=true}:{tools:CatalogEntry[];grouped?:boolean}) {
  const groups=grouped?[...new Set(tools.map(tool=>tool.subcategory))]:[""];
  return <div className="directory-groups">{groups.map(group=>{
    const category=tools.find(tool=>tool.subcategory===group)?.category;
    return <section key={group} id={group?`${category}-${categorySlug(group)}`:undefined}>
      {group&&<h2><Link href={`/calculators/${category}/${categorySlug(group)}`}>{group}</Link></h2>}
      <div className="directory-grid">{tools.filter(tool=>!group||tool.subcategory===group).map(tool=><CalculatorCard key={tool.slug} tool={calculatorCardData(tool)}/>)}</div>
    </section>;
  })}</div>;
}
