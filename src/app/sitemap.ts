import {categorySlug} from '@/lib/catalog-paths';
import type {MetadataRoute} from 'next';
import {site,categories} from '@/lib/site';
import {catalog,definitionMap} from '@/lib/calculators/registry';
import {information} from '@/data/information';
import {guides} from '@/data/guides';
import {locales,localizedPath,isTranslatedLanding} from '@/lib/i18n/config';
import {languageAlternates} from '@/lib/metadata';
export default function sitemap():MetadataRoute.Sitemap{
 if(!site.indexable)return [];
 const paths=['/','/calculators','/guides','/sitemap',...categories.map(c=>`/calculators/${c.id}`),...[...new Set(catalog.map(t=>`/calculators/${t.category}/${categorySlug(t.subcategory)}`))],...Object.keys(information).map(s=>`/${s}`),...Object.keys(guides).map(s=>`/guides/${s}`),...catalog.filter(t=>definitionMap.has(t.slug)).map(t=>`/${t.slug}`)];
 return paths.flatMap(path=>{
   const languages=languageAlternates(path);
   return (isTranslatedLanding(path)?locales:['en'] as const).map(locale=>({url:site.url+localizedPath(path,locale),...(languages?{alternates:{languages}}:{})}));
 });
}
