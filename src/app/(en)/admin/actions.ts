'use server';

import {revalidatePath} from 'next/cache';
import {requireSuperAdmin, AuthError} from '@/lib/server/auth';
import {saveBlogPost, BlogValidationError, BlogConflictError, BlogNotFoundError, BlogUnavailableError} from '@/lib/server/blog';
import type {BlogPost, SaveBlogPostInput} from '@/lib/blog/types';

export type SavePostResult = {ok: true; post: BlogPost} | {ok: false; message: string; fieldErrors?: Record<string, string[]>; signInRequired?: boolean; conflict?: boolean};

export async function savePostAction(input: SaveBlogPostInput): Promise<SavePostResult> {
  try {
    await requireSuperAdmin();
    const post = await saveBlogPost(input);
    for (const path of ['/blog', `/blog/${post.slug}`, '/sitemap.xml', '/sitemap', '/admin', '/admin/posts']) revalidatePath(path);
    if (input.id) revalidatePath(`/admin/posts/${post.id}`);
    return {ok: true, post};
  } catch (error) {
    if (error instanceof BlogValidationError) return {ok: false, message: error.message, fieldErrors: error.fieldErrors};
    if (error instanceof BlogConflictError) return {ok: false, message: error.message, conflict: true};
    if (error instanceof AuthError) return {ok: false, message: error.message, signInRequired: error.status === 401 || error.status === 403};
    if (error instanceof BlogNotFoundError || error instanceof BlogUnavailableError) return {ok: false, message: error.message};
    return {ok: false, message: 'The article could not be saved. Your edits are still here; please try again.'};
  }
}
