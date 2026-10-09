import {PageHero} from '@/components/content/page-hero';
import {notFound} from 'next/navigation';
import {categories} from '@/lib/site';
import {catalog} from '@/lib/calculators/registry';
import {pageMetadata} from '@/lib/metadata';
import {Breadcrumbs} from '@/components/content/breadcrumbs';
import {ToolDirectory} from '@/components/content/tool-directory';
export const dynamicParams=false;
export function generateStaticParams(){return categories.map(c=>({category:c.id}));}
export async function generateMetadata({params}:{params:Promise<{category:string}>}){const p=await params,c=categories.find(c=>c.id===p.category);return c?pageMetadata(c.label,c.description,`/calculators/${c.id}`):{};}
export default async function Page({params}:{params:Promise<{category:string}>}){const p=await params,c=categories.find(c=>c.id===p.category);if(!c)notFound();return <><PageHero eyebrow="FINFLO CALCULATORS" title={c.label} description={c.description}/><div className="container directory-page page-content"><Breadcrumbs items={[{label:'All calculators',href:'/calculators'},{label:c.name}]}/><ToolDirectory tools={catalog.filter(t=>t.category===c.id)}/></div></>;}
