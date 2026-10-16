import {notFound} from 'next/navigation';
import {guides} from '@/data/guides';
import {pageMetadata} from '@/lib/metadata';
import {InfoPage} from '@/components/content/info-page';
import {JsonLd} from '@/components/content/json-ld';
import {breadcrumbData, guideData} from '@/lib/structured-data';
export const dynamicParams=false;
export function generateStaticParams(){return Object.keys(guides).map(slug=>({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params,g=guides[slug];return g?pageMetadata(g.title,g.description,`/guides/${slug}`):{};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params,g=guides[slug];if(!g)notFound();return <>
 <InfoPage page={g} guide slug={slug} highlight={({'understanding-mortgage-payments':'mortgage payment','compound-interest-and-contributions':'Compounding, contributions','bmi-as-a-screening-tool':'adult BMI'} as Record<string,string>)[slug]}/>
 <JsonLd data={guideData(g.title,g.description,`/guides/${slug}`)}/>
 <JsonLd data={breadcrumbData([{name:'Home',path:'/'},{name:'Guides',path:'/guides'},{name:g.title,path:`/guides/${slug}`}])}/>
 </>;}
