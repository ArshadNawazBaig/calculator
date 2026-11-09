import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {BlogPost, SaveBlogPostInput} from '@/lib/blog/types';

const mocks = vi.hoisted(() => ({configured: vi.fn(), db: vi.fn(), authorize: vi.fn()}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/server/db', () => ({getDb: mocks.db, isDatabaseConfigured: mocks.configured}));
vi.mock('@/lib/server/auth', () => ({requireSuperAdmin: mocks.authorize}));
import {BlogConflictError, BlogUnavailableError, BlogValidationError, findPublishedPostBySlug, getAdminPost, getPublishedPostSitemapEntries, listAdminPosts, listPublishedPosts, saveBlogPost, setBlogPostStatus} from '@/lib/server/blog';

const id = '1b67a110-f2d0-4a26-a260-1a2ed7bf9588';
const row: BlogPost = {id, slug: 'local-test-example', title: 'Local test example', excerpt: 'This post exists only in a unit-test fixture.', content: 'A readable worked example for local testing.', category: 'Math', coverImageUrl: null, coverImageAlt: '', seoTitle: '', seoDescription: '', status: 'published', authorId: 'original-author', authorName: 'Fixture Author', publishedAt: '2026-11-09T10:00:00.000Z', createdAt: '2026-11-08T10:00:00.000Z', updatedAt: '2026-11-09T10:00:00.000Z', version: 1};
const input: SaveBlogPostInput = {slug: row.slug, title: row.title, excerpt: row.excerpt, content: row.content, category: row.category, coverImageUrl: null, coverImageAlt: '', seoTitle: '', seoDescription: ''};
const empty = {rows: [], rowCount: 0};
const query = vi.fn(), clientQuery = vi.fn(), release = vi.fn(), connect = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  mocks.configured.mockReturnValue(true);
  mocks.authorize.mockResolvedValue({user: {id: 'authorized-author', name: 'Authorized Writer', email: 'writer@example.invalid', role: 'super_admin'}, session: {id: 'test-session'}});
  connect.mockResolvedValue({query: clientQuery, release});
  mocks.db.mockReturnValue({query, connect});
  clientQuery.mockResolvedValue(empty);
});

describe('public blog repository boundaries', () => {
  it('returns an empty public state without a database, without creating a connection', async () => {
    mocks.configured.mockReturnValue(false);
    expect(await listPublishedPosts()).toEqual({posts: [], total: 0});
    expect(await findPublishedPostBySlug(row.slug)).toBeNull();
    expect(await getPublishedPostSitemapEntries()).toEqual([]);
    expect(mocks.db).not.toHaveBeenCalled();
    expect(mocks.authorize).not.toHaveBeenCalled();
  });
  it('filters public reads to published posts and omits body data from summaries', async () => {
    query.mockImplementation(async (sql: string) => sql.includes('COUNT(*)') ? {rows: [{total: '1'}]} : {rows: [row]});
    const result = await listPublishedPosts({page: 2, limit: 5, category: 'Math'});
    expect(result.total).toBe(1);
    expect(result.posts[0]).not.toHaveProperty('content');
    for (const [sql] of query.mock.calls) expect(sql).toContain("p.status = 'published'");
    expect(query.mock.calls[0][1]).toEqual(['Math', 5, 5]);
    expect(query.mock.calls[0][0]).not.toContain('p.content');
    expect(mocks.authorize).not.toHaveBeenCalled();
  });
  it('does not query invalid slugs or expose a draft by its slug', async () => {
    expect(await findPublishedPostBySlug('../draft')).toBeNull();
    expect(query).not.toHaveBeenCalled();
    query.mockResolvedValue(empty);
    expect(await findPublishedPostBySlug('valid-draft-slug')).toBeNull();
    expect(query.mock.calls[0][0]).toContain("AND p.status = 'published'");
    expect(query.mock.calls[0][1]).toEqual(['valid-draft-slug']);
  });
  it('normalizes database timestamps and includes only published sitemap entries', async () => {
    query.mockResolvedValue({rows: [{slug: row.slug, updatedAt: new Date(row.updatedAt)}]});
    expect(await getPublishedPostSitemapEntries()).toEqual([{slug: row.slug, updatedAt: row.updatedAt}]);
    expect(query.mock.calls[0][1]).toEqual(['published']);
  });
  it.each([() => listPublishedPosts(), () => findPublishedPostBySlug(row.slug), () => getPublishedPostSitemapEntries()])('throws a sanitized outage when a configured database fails', async run => {
    query.mockRejectedValue(new Error('SELECT private_table; password=secret'));
    try {await run(); expect.fail('Expected a configured outage');} catch (error) {
      expect(error).toBeInstanceOf(BlogUnavailableError);
      expect((error as Error).message).not.toMatch(/SELECT|password|secret|private_table/);
    }
  });
});

describe('admin authorization and safe filtering', () => {
  it.each([
    () => listAdminPosts(), () => getAdminPost(id), () => saveBlogPost(input), () => setBlogPostStatus(id, 'archived', 1),
  ])('authorizes at the repository entry before accessing data', async run => {
    const denied = new Error('Access denied by auth fixture');
    mocks.authorize.mockRejectedValue(denied);
    await expect(run()).rejects.toBe(denied);
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it('parameterizes title/excerpt search and treats wildcard characters literally', async () => {
    query.mockImplementation(async (sql: string) => sql.includes('COUNT(*)') ? {rows: [{total: '0'}]} : empty);
    await listAdminPosts({query: "100%_\\'"});
    expect(query.mock.calls[0][0]).toContain('p.title ILIKE $1');
    expect(query.mock.calls[0][0]).not.toContain("100%_\\'");
    expect(query.mock.calls[0][1]).toEqual(["%100\\%\\_\\\\'%", 20, 0]);
  });
});

describe('atomic editorial writes', () => {
  it('creates a draft with the authenticated author, ignoring form author and timestamps', async () => {
    clientQuery.mockImplementation(async (sql: string, values?: unknown[]) => {
      if (sql.startsWith('SELECT')) return {rows: [{...row, id: 'server-generated', status: 'draft', publishedAt: null, authorId: 'authorized-author'}]};
      if (sql.startsWith('INSERT INTO blog_posts')) {
        expect(values?.[9]).toBe('draft');
        expect(values?.[11]).toBe('authorized-author');
      }
      return empty;
    });
    const result = await saveBlogPost({...input, authorId: 'forged-author', publishedAt: '1990-01-01'} as SaveBlogPostInput);
    expect(result.status).toBe('draft');
    expect(result.authorId).toBe('authorized-author');
    expect(result.publishedAt).toBeNull();
    const sql = clientQuery.mock.calls.map(call => call[0] as string);
    expect(sql[0]).toBe('BEGIN');
    expect(sql.at(-1)).toBe('COMMIT');
    expect(sql.some(statement => statement.startsWith('INSERT INTO blog_post_audit'))).toBe(true);
    expect(release).toHaveBeenCalledOnce();
  });
  it('preserves published state on an ordinary save, author, publication time and version guard', async () => {
    clientQuery.mockResolvedValueOnce(empty).mockResolvedValueOnce({rows: [row]})
      .mockResolvedValueOnce({rows: [{version: 2}]}).mockResolvedValueOnce(empty)
      .mockResolvedValueOnce({rows: [{...row, title: 'Edited title', version: 2}]}).mockResolvedValueOnce(empty);
    const result = await saveBlogPost({...input, title: 'Edited title', id, expectedVersion: 1});
    expect(result.status).toBe('published');
    expect(result.authorId).toBe(row.authorId);
    expect(result.publishedAt).toBe(row.publishedAt);
    const update = clientQuery.mock.calls.find(call => String(call[0]).startsWith('UPDATE'))!;
    expect(update[0]).toContain('WHERE id=$11 AND version=$12');
    expect(update[0]).not.toContain('author_id=');
    expect(update[1][9]).toBe('published');
    expect(update[1].at(-1)).toBe(1);
  });
  it('rejects stale saves and rolls back instead of overwriting newer content', async () => {
    clientQuery.mockResolvedValueOnce(empty).mockResolvedValueOnce({rows: [{...row, version: 2}]});
    await expect(saveBlogPost({...input, id, expectedVersion: 1})).rejects.toBeInstanceOf(BlogConflictError);
    expect(clientQuery.mock.calls.some(call => String(call[0]).startsWith('UPDATE'))).toBe(false);
    expect(clientQuery.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
    expect(release).toHaveBeenCalledOnce();
  });
  it('detects a concurrent update that wins after the first version read', async () => {
    clientQuery.mockResolvedValueOnce(empty).mockResolvedValueOnce({rows: [row]}).mockResolvedValueOnce(empty);
    await expect(saveBlogPost({...input, id, expectedVersion: 1})).rejects.toBeInstanceOf(BlogConflictError);
    expect(clientQuery.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
    expect(clientQuery.mock.calls.some(call => String(call[0]).startsWith('INSERT INTO blog_post_audit'))).toBe(false);
  });
  it('locks a published slug even after explicit unpublication', async () => {
    clientQuery.mockResolvedValueOnce(empty).mockResolvedValueOnce({rows: [{...row, status: 'draft'}]});
    await expect(saveBlogPost({...input, id, slug: 'a-different-url', expectedVersion: 1})).rejects.toBeInstanceOf(BlogValidationError);
    expect(clientQuery.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
  });
  it('requires readable stored content when changing a draft to published', async () => {
    clientQuery.mockResolvedValueOnce(empty).mockResolvedValueOnce({rows: [{...row, status: 'draft', publishedAt: null, content: '<div>HTML only</div>'}]});
    await expect(setBlogPostStatus(id, 'published', 1)).rejects.toBeInstanceOf(BlogValidationError);
    expect(clientQuery.mock.calls.some(call => String(call[0]).startsWith('UPDATE'))).toBe(false);
  });
  it('archives with an optimistic guard and retained first-publication timestamp instead of deleting', async () => {
    clientQuery.mockResolvedValueOnce(empty).mockResolvedValueOnce({rows: [row]})
      .mockResolvedValueOnce({rows: [{version: 2}]}).mockResolvedValueOnce(empty)
      .mockResolvedValueOnce({rows: [{...row, status: 'archived', version: 2}]}).mockResolvedValueOnce(empty);
    const result = await setBlogPostStatus(id, 'archived', 1);
    expect(result.status).toBe('archived');
    expect(result.publishedAt).toBe(row.publishedAt);
    const sql = clientQuery.mock.calls.map(call => String(call[0])).join('\n');
    expect(sql).toContain('WHERE id=$2 AND version=$3');
    expect(sql).not.toMatch(/DELETE FROM/i);
  });
  it('rolls back a write when its audit insert fails', async () => {
    clientQuery.mockResolvedValueOnce(empty).mockResolvedValueOnce(empty).mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(saveBlogPost(input)).rejects.toBeInstanceOf(BlogUnavailableError);
    expect(clientQuery.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
    expect(clientQuery.mock.calls.some(call => call[0] === 'COMMIT')).toBe(false);
    expect(release).toHaveBeenCalledOnce();
  });
  it('turns duplicate slugs into field validation errors without exposing SQL', async () => {
    clientQuery.mockResolvedValueOnce(empty).mockRejectedValueOnce({code: '23505', message: 'secret SQL details'});
    try {await saveBlogPost(input); expect.fail('Expected a duplicate-slug error');} catch (error) {
      expect(error).toBeInstanceOf(BlogValidationError);
      expect((error as BlogValidationError).fieldErrors).toHaveProperty('slug');
      expect((error as Error).message).not.toContain('SQL');
    }
  });
});
