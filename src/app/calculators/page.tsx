import Link from 'next/link';
import {catalog} from '@/lib/calculators/registry';
import {categories} from '@/lib/site';
import {pageMetadata} from '@/lib/metadata';
import {Breadcrumbs} from '@/components/content/breadcrumbs';
import {ToolDirectory} from '@/components/content/tool-directory';
import {Search} from '@/components/search';
export const metadata=pageMetadata('All calculators','Find finance, health, math, and everyday calculators in Finflo’s complete tool directory.','/calculators');
export default function Page(){return <div className="container directory-page"><Breadcrumbs items={[{label:'All calculators'}]}/><header className="page-heading"><span className="eyebrow">THE CALCULATOR LIBRARY</span><h1>All calculators</h1><p>Browse calculations for money, health, math, and everyday life.</p><Search/></header><nav className="category-pills" aria-label="Jump to category">{categories.map(c=><a key={c.id} href={`#${c.id}`}>{c.name}<span>{catalog.filter(t=>t.category===c.id).length}</span></a>)}</nav>{categories.map(c=><section className="category-directory" id={c.id} key={c.id}><div className="section-heading"><div><span className="eyebrow">{c.description}</span><h2>{c.name}</h2></div><Link href={`/calculators/${c.id}`} className="text-link">Explore {c.name.toLowerCase()}</Link></div><ToolDirectory tools={catalog.filter(t=>t.category===c.id)}/></section>)}</div>;}
