import type {Metadata} from 'next';
import {BLOG_CATEGORIES,type BlogPost} from '@/lib/blog/types';
import {pageMetadata} from '@/lib/metadata';
import {organizationData} from '@/lib/structured-data';
import {site} from '@/lib/site';
import {blogContentUrl} from './blog-markdown';

export const blogCategories = BLOG_CATEGORIES;
export type PublicBlogCategory = typeof blogCategories[number];
export const blogPostPath = (slug:string) => `/blog/${encodeURIComponent(slug)}`;
export const blogDate = (value:string) => new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(value));

export function blogPostMetadata(post:BlogPost):Metadata {
  const title=post.seoTitle?.trim() || post.title, description=post.seoDescription?.trim() || post.excerpt;
  const metadata=pageMetadata(title,description,blogPostPath(post.slug));
  const image=post.coverImageUrl&&post.coverImageAlt?.trim()?blogContentUrl(post.coverImageUrl,true):undefined;
  return {...metadata,authors:[{name:post.authorName}],openGraph:{...metadata.openGraph,type:'article',publishedTime:post.publishedAt||undefined,modifiedTime:post.updatedAt,authors:[post.authorName],...(image?{images:[{url:image,alt:post.coverImageAlt}]}:{})},twitter:{...metadata.twitter,...(image?{images:[image]}:{})}};
}

export function blogArticleData(post:BlogPost) {
  const url=site.url+blogPostPath(post.slug), image=post.coverImageUrl&&post.coverImageAlt?.trim()?blogContentUrl(post.coverImageUrl,true):undefined;
  return {'@context':'https://schema.org','@type':'BlogPosting','@id':`${url}#article`,headline:post.title,description:post.excerpt,url,mainEntityOfPage:url,inLanguage:'en',articleSection:post.category,author:{'@type':'Person',name:post.authorName},publisher:organizationData(),...(post.publishedAt?{datePublished:post.publishedAt}:{}),dateModified:post.updatedAt,...(image?{image:new URL(image,site.url).href}:{})};
}
