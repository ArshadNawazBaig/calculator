import type {Metadata} from 'next';
import {site} from './site';
import {locales,localizedPath,isTranslatedPage,type Locale} from './i18n/config';
export const socialImage={url:site.url+'/og.png',width:1730,height:909,alt:'Finflo — Find your answer. Free calculators for life’s big and small decisions.'};
export function languageAlternates(path:string){return isTranslatedPage(path)?Object.fromEntries([...locales.map(locale=>[locale,site.url+localizedPath(path,locale)]),['x-default',site.url+path]]):undefined;}
export function pageMetadata(title:string,description:string,path:string,index=true,locale:Locale='en'):Metadata{
 const canonical=localizedPath(path,locale);
 const ogLocale={en:'en_US',es:'es_ES',fr:'fr_FR',de:'de_DE',pt:'pt_BR',ar:'ar_SA',hi:'hi_IN',tl:'tl_PH'}[locale];
 return {title:{absolute:title},description,alternates:{canonical,languages:languageAlternates(path)},robots:{index:site.indexable&&index,follow:true},openGraph:{title,description,url:site.url+canonical,locale:ogLocale,type:'website',siteName:'Finflo',images:[socialImage]},twitter:{card:'summary_large_image',title,description,images:[socialImage.url]}};
}
