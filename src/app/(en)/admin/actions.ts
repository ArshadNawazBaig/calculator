'use server';

import {revalidatePath} from 'next/cache';
import {redirect, RedirectType} from 'next/navigation';
import {requireSuperAdmin, AuthError} from '@/lib/server/auth';
import {deleteBlogPost, saveBlogPost, BlogValidationError, BlogConflictError, BlogNotFoundError, BlogUnavailableError} from '@/lib/server/blog';
import type {BlogPost, SaveBlogPostInput} from '@/lib/blog/types';

type PostActionFailure = {ok: false; message: string; fieldErrors?: Record<string, string[]>; signInRequired?: boolean; conflict?: boolean};
export type SavePostResult = {ok: true; post: BlogPost} | PostActionFailure;

function postActionFailure(error: unknown, fallback: string): PostActionFailure {
  if (error instanceof BlogValidationError) return {ok: false, message: error.message, fieldErrors: error.fieldErrors};
  if (error instanceof BlogConflictError) return {ok: false, message: error.message, conflict: true};
  if (error instanceof AuthError) return {ok: false, message: error.message, signInRequired: error.status === 401 || error.status === 403};
  if (error instanceof BlogNotFoundError || error instanceof BlogUnavailableError) return {ok: false, message: error.message};
  return {ok: false, message: fallback};
}

function revalidatePostPages(slug: string | null, id?: string) {
  for (const path of ['/blog', '/sitemap.xml', '/sitemap-en.xml', '/sitemap', '/admin', '/admin/posts']) revalidatePath(path);
  if (slug) revalidatePath(`/blog/${slug}`);
  if (id) {
    revalidatePath(`/admin/posts/${id}`);
    revalidatePath(`/admin/posts/${id}/preview`);
  }
}

export async function savePostAction(input: SaveBlogPostInput): Promise<SavePostResult> {
  try {
    await requireSuperAdmin();
    const post = await saveBlogPost(input);
    revalidatePostPages(post.slug, input.id);
    return {ok: true, post};
  } catch (error) {
    return postActionFailure(error, 'The article could not be saved. Your edits are still here; please try again.');
  }
}

export async function deletePostAction(id: string, expectedVersion: number): Promise<PostActionFailure> {
  try {
    await requireSuperAdmin();
    const slug = await deleteBlogPost(id, expectedVersion);
    revalidatePostPages(slug, id);
  } catch (error) {
    return postActionFailure(error, 'The article could not be deleted. Please try again.');
  }
  redirect('/admin/posts?deleted=1', RedirectType.replace);
}
