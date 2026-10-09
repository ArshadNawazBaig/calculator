import Link from 'next/link';
import {categorySlug} from '@/lib/catalog-paths';
import {ArrowUpRight} from 'lucide-react';
import type {CatalogEntry} from '@/lib/calculators/types';
const unavailable=new Set(['mileage-calculator','weight-watchers-points-calculator']);
export function ToolDirectory({tools,grouped=true}:{tools:CatalogEntry[];grouped?:boolean}){const groups=grouped?[...new Set(tools.map(t=>t.subcategory))]:[''];return <div className="directory-groups">{groups.map(group=><section key={group} id={group?`${tools.find(t=>t.subcategory===group)!.category}-${categorySlug(group)}`:undefined}>{group&&<h2><Link href={`/calculators/${tools.find(t=>t.subcategory===group)!.category}/${categorySlug(group)}`}>{group} <span aria-hidden="true">↗</span></Link></h2>}<div className="directory-grid">{tools.filter(t=>!group||t.subcategory===group).map(t=><Link href={`/${t.slug}`} key={t.slug} className="directory-link"><span>{t.title}{unavailable.has(t.slug)&&t.type!=='directory'&&<small>Availability information</small>}</span><ArrowUpRight size={17} aria-hidden="true"/></Link>)}</div></section>)}</div>;}
