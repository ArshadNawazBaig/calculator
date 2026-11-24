import {cache} from 'react';
import {BlogUnavailableError,findPublishedPostBySlug,listPublishedPosts,listRelatedPublishedPosts} from '@/lib/server/blog';
import type {BlogPost} from '@/lib/blog/types';
import type {PublicBlogCategory} from './blog-meta';

// React cache deduplicates a metadata/body read within one request only.
// There is no persistent cache that could keep an unpublished article visible.
export const publishedPost = cache((slug:string)=>findPublishedPostBySlug(slug));
export const publishedPosts = cache((page:number,category?:PublicBlogCategory)=>listPublishedPosts({page,limit:12,category}));

export async function relatedPostsFor(post:BlogPost) {
  try {
    return await listRelatedPublishedPosts(post);
  } catch (error) {
    // A failed recommendation read can still leave the main article available.
    if (error instanceof BlogUnavailableError) return [];
    throw error;
  }
}
