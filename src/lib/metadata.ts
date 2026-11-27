import type {Metadata} from 'next';
import {site} from './site';
import {localizedPath,isPublishedLocale,publishedPageLocales,type Locale} from './i18n/config';
import pregnancyVisuals from '@/data/locales/pregnancy-visuals.json';
import {mathSearchContent} from '@/data/math-search-content';
import {calculatorVisual} from './calculator-visual';
export const socialImage={url:site.url+'/og.png',width:1730,height:909,alt:'Finflo — Find your answer. Free calculators for life’s big and small decisions.'};
export function languageAlternates(path:string){const available=publishedPageLocales(path);return available.length>1?Object.fromEntries([...available.map(locale=>[locale,site.url+localizedPath(path,locale)]),['x-default',site.url+path]]):undefined;}
export function pageMetadata(title:string,description:string,path:string,index=true,locale:Locale='en',visualTitle?:string):Metadata{
 title = title.replace(/\s*\|\s*Finflo\s*$/i, '');
 const canonical=localizedPath(path,locale);
 const ogLocale={en:'en_US',es:'es_ES',fr:'fr_FR',de:'de_DE',pt:'pt_BR',ar:'ar_SA',hi:'hi_IN',tl:'tl_PH'}[locale];
 const pregnancy=path==='/pregnancy-calculator'?pregnancyVisuals[locale]:undefined;
 const visual=visualTitle?calculatorVisual(path.slice(1),locale,visualTitle):undefined;
 const image=pregnancy?{url:site.url+'/illustrations/pregnancy/pregnancy-due-date-social.jpg',width:1200,height:630,alt:pregnancy.alt}:visual?{url:site.url+visual.socialSrc,width:visual.width,height:visual.height,alt:visual.alt}:socialImage;
 description=pregnancy?.seoDescription||description;
 const metadata: Metadata = {title:{absolute:title},description,alternates:{canonical,languages:languageAlternates(path)},robots:{index:site.indexable&&index&&isPublishedLocale(locale),follow:true},openGraph:{title,description,url:site.url+canonical,locale:ogLocale,type:'website',siteName:site.websiteName,images:[image]},twitter:{card:'summary_large_image',title,description,images:pregnancy||visual?[image]:[image.url]}};
 const guide = visualTitle ? mathSearchContent[path.slice(1)] : undefined;
 if (!guide?.publishedAt) return metadata;
 const authorUrl = site.url + localizedPath('/about', locale);
 return {
   ...metadata,
   authors: [{name: site.name, url: authorUrl}],
   openGraph: {...metadata.openGraph, type: 'article', authors: [authorUrl], publishedTime: guide.publishedAt, modifiedTime: guide.modifiedAt},
 };
}
