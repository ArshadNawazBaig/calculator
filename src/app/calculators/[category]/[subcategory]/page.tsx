import {PageHero} from '@/components/content/page-hero';
import {notFound} from 'next/navigation';
import {categories} from '@/lib/site';
import {catalog} from '@/lib/calculators/registry';
import {categorySlug} from '@/lib/catalog-paths';
import {pageMetadata} from '@/lib/metadata';
import {FilterableToolDirectory} from '@/components/content/filterable-tool-directory';
export const dynamicParams=false;
export function generateStaticParams(){return [...new Map(catalog.map(t=>[t.category+'/'+categorySlug(t.subcategory),{category:t.category,subcategory:categorySlug(t.subcategory)}])).values()];}
function group(category:string,subcategory:string){return catalog.filter(t=>t.category===category&&categorySlug(t.subcategory)===subcategory);}
export async function generateMetadata({params}:{params:Promise<{category:string;subcategory:string}>}){const p=await params,tools=group(p.category,p.subcategory),category=categories.find(c=>c.id===p.category);return tools.length?pageMetadata(`${tools[0].subcategory} ${category?.name.toLowerCase()} calculators`,`Explore ${tools[0].subcategory.toLowerCase()} ${category?.name.toLowerCase()} tools with clear inputs, worked examples, and transparent calculation methods.`,`/calculators/${p.category}/${p.subcategory}`):{};}
export default async function Page({params}:{params:Promise<{category:string;subcategory:string}>}){const p=await params,c=categories.find(c=>c.id===p.category),tools=group(p.category,p.subcategory);if(!c||!tools.length)notFound();return <><PageHero eyebrow={`${c.name} · FINFLO`} title={`${tools[0].subcategory} calculators`} description="Find the calculation that fits your question. Each tool explains its supported inputs, formulas, and assumptions." breadcrumbs={[{label:'Calculators',href:'/calculators'},{label:c.name,href:`/calculators/${c.id}`},{label:tools[0].subcategory}]}/><div className="container directory-page page-content"><FilterableToolDirectory key={`${c.id}/${p.subcategory}`} tools={tools} grouped={false}/></div></>;}
