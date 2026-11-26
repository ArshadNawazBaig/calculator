import type {Metadata} from 'next';
import {blogAuthor} from '@/lib/blog/author';
import {BLOG_CATEGORIES,type BlogPost} from '@/lib/blog/types';
import {pageMetadata} from '@/lib/metadata';
import {organizationData} from '@/lib/structured-data';
import {site} from '@/lib/site';
import {blogContentUrl} from './blog-markdown';

export const blogCategories = BLOG_CATEGORIES;
export type PublicBlogCategory = typeof blogCategories[number];
export const blogPostPath = (slug:string) => `/blog/${encodeURIComponent(slug)}`;
export const blogDate = (value:string) => new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(value));

export function blogIndexPath(page=1,category?:PublicBlogCategory) {
  const query=new URLSearchParams();
  if (category) query.set('category',category);
  if (page>1) query.set('page',String(page));
  return '/blog'+(query.size?'?'+query.toString():'');
}

export function blogCoverUrl(post:Pick<BlogPost,'coverImageUrl'|'coverImageAlt'>) {
  return post.coverImageUrl && post.coverImageAlt?.trim() ? blogContentUrl(post.coverImageUrl,true) : undefined;
}

export function blogPostMetadata(post:BlogPost):Metadata {
  const title=post.seoTitle?.trim() || post.title, description=post.seoDescription?.trim() || post.excerpt;
  const metadata=pageMetadata(title,description,blogPostPath(post.slug));
  const image=blogCoverUrl(post);
  const author = blogAuthor(post.authorName);
  const authorUrl = author.profilePath && new URL(author.profilePath, site.url).href;
  return {
    ...metadata,
    authors: [{name: author.name, ...(authorUrl && {url: authorUrl})}],
    openGraph: {
      ...metadata.openGraph, type: 'article', authors: [authorUrl || author.name],
      publishedTime: post.publishedAt || undefined, modifiedTime: post.updatedAt,
      ...(image && {images: [{url: image, alt: post.coverImageAlt}]}),
    },
    twitter: {...metadata.twitter, ...(image && {images: [image]})},
  };
}

export function blogArticleData(post:BlogPost) {
  const url=site.url+blogPostPath(post.slug), image=blogCoverUrl(post);
  const profile = blogAuthor(post.authorName);
  const publisher = organizationData();
  const author = {
    '@type': 'Person', name: profile.name,
    ...(profile.profilePath && {url: new URL(profile.profilePath, site.url).href}),
    ...(profile.avatar && {image: new URL(profile.avatar, site.url).href}),
    ...(profile.jobTitle && {jobTitle: profile.jobTitle, worksFor: {'@id': publisher['@id']}}),
  };
  return {
    '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': `${url}#article`,
    headline: post.title, description: post.excerpt, url, mainEntityOfPage: url,
    inLanguage: 'en', articleSection: post.category, author, publisher,
    ...(post.publishedAt && {datePublished: post.publishedAt}),
    dateModified: post.updatedAt,
    ...(image && {image: new URL(image, site.url).href}),
  };
}
