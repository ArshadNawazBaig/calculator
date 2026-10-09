import Link from "next/link";
import {categorySlug} from "@/lib/catalog-paths";
import {Icon, toolIconName} from "@/components/ui/icon";
import type {CatalogEntry} from "@/lib/calculators/types";

const unavailable=new Set(["mileage-calculator","weight-watchers-points-calculator"]);

export function ToolDirectory({tools,grouped=true}:{tools:CatalogEntry[];grouped?:boolean}) {
  const groups=grouped?[...new Set(tools.map(t=>t.subcategory))]:[""];
  return <div className="directory-groups">{groups.map(group => {
    const category=tools.find(t=>t.subcategory===group)?.category;
    return <section key={group} id={group?`${category}-${categorySlug(group)}`:undefined}>
      {group&&<h2><Link href={`/calculators/${category}/${categorySlug(group)}`}>{group}</Link></h2>}
      <div className="directory-grid">{tools.filter(t=>!group||t.subcategory===group).map(tool =>
        <Link href={`/${tool.slug}`} key={tool.slug} className="directory-link">
          <span className="directory-icon"><Icon name={toolIconName(tool.slug,tool.category)} size={21}/></span>
          <span>{tool.title}{unavailable.has(tool.slug)&&tool.type!=="directory"&&<small>Availability information</small>}</span>
        </Link>
      )}</div>
    </section>;
  })}</div>;
}
