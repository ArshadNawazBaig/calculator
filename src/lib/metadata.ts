import type {Metadata} from 'next';
import {site} from './site';
export const socialImage={url:site.url+'/og-image.png',width:1200,height:630,alt:'Finflo — Every calculation. A clearer decision.'};
export function pageMetadata(title:string,description:string,path:string,index=true):Metadata{return {title,description,alternates:{canonical:path},robots:{index:site.indexable&&index,follow:true},openGraph:{title:`${title} | Finflo`,description,url:site.url+path,type:'website',siteName:'Finflo',images:[socialImage]},twitter:{card:'summary_large_image',title:`${title} | Finflo`,description,images:[socialImage.url]}};}
