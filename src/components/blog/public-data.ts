import {cache} from 'react';
import {findPublishedPostBySlug,listPublishedPosts} from '@/lib/server/blog';
import type {PublicBlogCategory} from './blog-meta';

// React cache deduplicates a metadata/body read within one request only.
// There is no persistent cache that could keep an unpublished article visible.
export const publishedPost = cache((slug:string)=>findPublishedPostBySlug(slug));
export const publishedPosts = cache((page:number,category?:PublicBlogCategory)=>listPublishedPosts({page,limit:12,category}));
