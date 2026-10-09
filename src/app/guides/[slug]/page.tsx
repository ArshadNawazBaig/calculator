import {notFound} from 'next/navigation';
import {guides} from '@/data/guides';
import {pageMetadata} from '@/lib/metadata';
import {InfoPage} from '@/components/content/info-page';
export const dynamicParams=false;
export function generateStaticParams(){return Object.keys(guides).map(slug=>({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params,g=guides[slug];return g?pageMetadata(g.title,g.description,`/guides/${slug}`):{};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params,g=guides[slug];if(!g)notFound();return <InfoPage page={g} guide highlight={({'understanding-mortgage-payments':'mortgage payment','compound-interest-and-contributions':'Compounding, contributions','bmi-as-a-screening-tool':'adult BMI'} as Record<string,string>)[slug]}/>;}
