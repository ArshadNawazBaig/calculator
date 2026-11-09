import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {BlogPost, SaveBlogPostInput} from '@/lib/blog/types';

const mocks = vi.hoisted(() => ({authorize: vi.fn(), save: vi.fn(), revalidate: vi.fn()}));
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({revalidatePath: mocks.revalidate}));
vi.mock('@/lib/server/auth', async () => ({requireSuperAdmin: mocks.authorize, AuthError: (await import('@/lib/server/auth-core')).AuthError}));
vi.mock('@/lib/server/blog', async importOriginal => ({...await importOriginal<typeof import('@/lib/server/blog')>(), saveBlogPost: mocks.save}));
import {AuthError} from '@/lib/server/auth-core';
import {BlogValidationError, BlogConflictError} from '@/lib/server/blog';
import {savePostAction} from '@/app/(en)/admin/actions';

const input: SaveBlogPostInput = {slug: 'worked-example', title: 'Worked example', excerpt: 'A useful summary.', content: 'An original explanation.', category: 'Math', coverImageUrl: null, coverImageAlt: '', seoTitle: '', seoDescription: ''};
const post: BlogPost = {...input, id: 'd84cb84c-512f-4bf1-8791-ffb635c63691', status: 'draft', authorId: 'author', authorName: 'Test author', publishedAt: null, createdAt: '2026-11-09T00:00:00.000Z', updatedAt: '2026-11-09T00:00:00.000Z', version: 1};
beforeEach(() => {vi.resetAllMocks(); mocks.authorize.mockResolvedValue({user: {id: 'author'}}); mocks.save.mockResolvedValue(post);});

describe('privileged publishing action boundary', () => {
  it.each([401, 403] as const)('rejects authorization status %i before any write or invalidation', async status => {
    mocks.authorize.mockRejectedValue(new AuthError('Sign in to continue.', status));
    expect(await savePostAction(input)).toMatchObject({ok: false, signInRequired: true});
    expect(mocks.save).not.toHaveBeenCalled(); expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('invalidates public listings, the article and sitemaps only after a successful write', async () => {
    expect(await savePostAction(input)).toEqual({ok: true, post});
    expect(mocks.authorize.mock.invocationCallOrder[0]).toBeLessThan(mocks.save.mock.invocationCallOrder[0]);
    for (const path of ['/blog', '/blog/worked-example', '/sitemap.xml', '/sitemap', '/admin/posts']) expect(mocks.revalidate).toHaveBeenCalledWith(path);
  });
  it('returns field errors without discarding the editor input or pretending to publish', async () => {
    mocks.save.mockRejectedValue(new BlogValidationError('Check the highlighted post fields.', {content: ['Add readable text.']}));
    expect(await savePostAction({...input, status: 'published'})).toEqual({ok: false, message: 'Check the highlighted post fields.', fieldErrors: {content: ['Add readable text.']}});
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('exposes optimistic conflicts explicitly so a stale editor cannot silently overwrite', async () => {
    mocks.save.mockRejectedValue(new BlogConflictError());
    expect(await savePostAction(input)).toMatchObject({ok: false, conflict: true});
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('does not expose unexpected database/provider error details', async () => {
    mocks.save.mockRejectedValue(new Error('private-connection-token'));
    const result = await savePostAction(input);
    expect(result.ok).toBe(false); expect(JSON.stringify(result)).not.toContain('private-connection-token');
  });
});
