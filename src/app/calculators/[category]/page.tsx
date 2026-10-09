import {PageHero} from '@/components/content/page-hero';
import {notFound} from 'next/navigation';
import {categories} from '@/lib/site';
import {catalog} from '@/lib/calculators/registry';
import {pageMetadata} from '@/lib/metadata';
import {FilterableToolDirectory} from '@/components/content/filterable-tool-directory';
export const dynamicParams=false;
export function generateStaticParams(){return categories.map(c=>({category:c.id}));}
export async function generateMetadata({params}:{params:Promise<{category:string}>}){const p=await params,c=categories.find(c=>c.id===p.category);return c?pageMetadata(c.label,c.description,`/calculators/${c.id}`):{};}
export default async function Page({params}:{params:Promise<{category:string}>}){const p=await params,c=categories.find(c=>c.id===p.category);if(!c)notFound();return <><PageHero eyebrow="FINFLO CALCULATORS" title={c.label} description={c.description} breadcrumbs={[{label:'All calculators',href:'/calculators'},{label:c.name}]}/><div className="container directory-page page-content"><FilterableToolDirectory category={c.id} key={c.id} tools={catalog.filter(t=>t.category===c.id)}/></div></>;}
