import {studentDirectory} from '@/lib/student-tools';
import {mathSearchContent} from '@/data/math-search-content';
import {timePaths} from '@/lib/time/catalog';
import {categorySlug} from '@/lib/catalog-paths';
import type {MetadataRoute} from 'next';
import {site,categories} from '@/lib/site';
import {catalog,definitionMap} from '@/lib/calculators/registry';
import {information} from '@/data/information';
import {guides} from '@/data/guides';
import {localizedPath,publishedPageLocales} from '@/lib/i18n/config';
import {languageAlternates} from '@/lib/metadata';
import {spinWheels,wheelHref} from '@/lib/spin-wheels/catalog';
export default function sitemap():MetadataRoute.Sitemap{
 if(!site.indexable)return [];
 const paths=[...timePaths,'/','/calculators',studentDirectory.path,'/guides','/sitemap','/faq','/spin-wheels',...spinWheels.map(wheel=>wheelHref(wheel.slug)),...categories.map(c=>`/calculators/${c.id}`),...[...new Set(catalog.map(t=>`/calculators/${t.category}/${categorySlug(t.subcategory)}`))],...Object.keys(information).map(s=>`/${s}`),...Object.keys(guides).map(s=>`/guides/${s}`),...catalog.filter(t=>definitionMap.has(t.slug)).map(t=>`/${t.slug}`)];
 return paths.flatMap(path=>{
   const languages=languageAlternates(path);
   // These dates record actual English content edits, never the sitemap fetch/build time.
   const modifiedAt=mathSearchContent[path.slice(1)]?.modifiedAt;
   return publishedPageLocales(path).map(locale=>({url:site.url+localizedPath(path,locale),...(locale==='en'&&modifiedAt?{lastModified:modifiedAt}:{}),...(languages?{alternates:{languages}}:{})}));
 });
}
