import {site} from '@/lib/site';
import content from './information-content.json';
export type InfoPage={title:string;description:string;sections:{title:string;paragraphs:string[];links?:{label:string;href:string}[]}[]};
const resolve=(value:string)=>value.replaceAll('{contactEmail}',site.email);
export const information:Record<string,InfoPage>=Object.fromEntries(Object.entries(content).map(([slug,page])=>[slug,{...page,sections:page.sections.map(section=>({...section,paragraphs:section.paragraphs.map(resolve),...('links' in section?{links:section.links?.map(link=>({label:resolve(link.label),href:resolve(link.href)}))}:{})}))}]));
