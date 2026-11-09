import 'server-only';
import {randomUUID} from 'node:crypto';
import type {PoolClient} from 'pg';
import {z} from 'zod';
import {requireSuperAdmin} from './auth';
import {getDb, isDatabaseConfigured} from './db';
import {BLOG_CATEGORIES, BLOG_POST_STATUSES, type AdminPostOptions, type BlogPage, type BlogPost, type BlogPostStatus, type BlogPostSummary, type PublishedPostOptions, type SaveBlogPostInput} from '@/lib/blog/types';
import {BlogValidationError, blogSlugSchema, validateBlogPostInput} from '@/lib/blog/validation';

export {BlogValidationError} from '@/lib/blog/validation';
export class BlogConflictError extends Error {
  readonly status = 409;
  constructor() {super('This post changed while you were editing. Reload the latest version before saving.'); this.name = 'BlogConflictError';}
}
export class BlogUnavailableError extends Error {
  readonly status = 503;
  constructor() {super('The blog is temporarily unavailable. Please try again shortly.'); this.name = 'BlogUnavailableError';}
}
export class BlogNotFoundError extends Error {
  readonly status = 404;
  constructor() {super('This post could not be found.'); this.name = 'BlogNotFoundError';}
}

type PostRow = Omit<BlogPost, 'publishedAt' | 'createdAt' | 'updatedAt'> & {
  publishedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};
const columns = `p.id, p.slug, p.title, p.excerpt, p.category,
  p.cover_image_url AS "coverImageUrl", p.cover_image_alt AS "coverImageAlt",
  p.seo_title AS "seoTitle", p.seo_description AS "seoDescription", p.status,
  p.author_id AS "authorId", u.name AS "authorName", p.published_at AS "publishedAt",
  p.created_at AS "createdAt", p.updated_at AS "updatedAt", p.version`;
const fromPosts = 'FROM blog_posts p JOIN blog_user u ON u.id = p.author_id';
const fullSelect = `SELECT ${columns}, p.content ${fromPosts}`;
const pageSchema = z.number().int().min(1).max(100_000).default(1);
const limitSchema = z.number().int().min(1).max(100).default(12);
const idSchema = z.uuid();
const versionSchema = z.number().int().min(1).max(2_147_483_646);

function valid<T>(schema: z.ZodType<T>, input: unknown, field: string): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new BlogValidationError(`Check the ${field}.`, {[field]: [result.error.issues[0]?.message || 'Enter a valid value.']});
  return result.data;
}
function summary(row: PostRow): BlogPostSummary {
  return {id: row.id, slug: row.slug, title: row.title, excerpt: row.excerpt, category: row.category,
    coverImageUrl: row.coverImageUrl, coverImageAlt: row.coverImageAlt, seoTitle: row.seoTitle, seoDescription: row.seoDescription,
    status: row.status, authorId: row.authorId, authorName: row.authorName, version: row.version,
    publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(), updatedAt: new Date(row.updatedAt).toISOString()};
}
function post(row: PostRow): BlogPost {return {...summary(row), content: row.content};}
function sanitize(error: unknown): Error {
  if (error instanceof BlogValidationError || error instanceof BlogConflictError || error instanceof BlogNotFoundError || error instanceof BlogUnavailableError) return error;
  const detail = error as {code?: string; constraint?: string} | null;
  if (detail?.code === '23505') return new BlogValidationError('That URL slug is already in use.', {slug: ['Choose a different URL slug.']});
  if (detail?.code === '23514' && detail.constraint === 'blog_published_slug_immutable') return immutableSlugError();
  return new BlogUnavailableError();
}
function immutableSlugError() {return new BlogValidationError('A previously published URL slug cannot be changed.', {slug: ['Keep the existing slug so published links continue to work.']});}
async function transaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
  let client: PoolClient | undefined;
  try {
    client = await getDb().connect();
    await client.query('BEGIN');
    const value = await operation(client);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    if (client) try {await client.query('ROLLBACK');} catch { /* Preserve the original safe error. */ }
    throw sanitize(error);
  } finally {client?.release();}
}
async function readPost(client: PoolClient, id: string): Promise<BlogPost> {
  const result = await client.query<PostRow>(`${fullSelect} WHERE p.id = $1`, [id]);
  if (!result.rows[0]) throw new BlogNotFoundError();
  return post(result.rows[0]);
}
async function audit(client: PoolClient, postId: string, actorId: string, action: string, fromStatus: BlogPostStatus | null, toStatus: BlogPostStatus, version: number) {
  await client.query('INSERT INTO blog_post_audit (post_id, actor_id, action, from_status, to_status, post_version) VALUES ($1, $2, $3, $4, $5, $6)', [postId, actorId, action, fromStatus, toStatus, version]);
}

/** An unconfigured installation publishes no posts; configured outages remain errors. */
export async function listPublishedPosts(options: PublishedPostOptions = {}): Promise<BlogPage> {
  if (!isDatabaseConfigured()) return {posts: [], total: 0};
  const page = valid(pageSchema, options.page, 'page'), limit = valid(limitSchema, options.limit, 'limit');
  const category = options.category === undefined ? undefined : valid(z.enum(BLOG_CATEGORIES), options.category, 'category');
  const params: unknown[] = [], where = ["p.status = 'published'"];
  if (category) {params.push(category); where.push(`p.category = $${params.length}`);}
  const filter = `WHERE ${where.join(' AND ')}`;
  try {
    const [rows, count] = await Promise.all([
      getDb().query<PostRow>(`SELECT ${columns} ${fromPosts} ${filter} ORDER BY p.published_at DESC, p.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, (page - 1) * limit]),
      getDb().query<{total: string}>(`SELECT COUNT(*) AS total FROM blog_posts p ${filter}`, params),
    ]);
    return {posts: rows.rows.map(summary), total: Number(count.rows[0].total)};
  } catch (error) {throw sanitize(error);}
}

export async function findPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!isDatabaseConfigured() || !blogSlugSchema.safeParse(slug).success || slug !== slug.trim()) return null;
  try {
    const result = await getDb().query<PostRow>(`${fullSelect} WHERE p.slug = $1 AND p.status = 'published'`, [slug]);
    return result.rows[0] ? post(result.rows[0]) : null;
  } catch (error) {throw sanitize(error);}
}

export async function getPublishedPostSitemapEntries(): Promise<{slug: string; updatedAt: string}[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const result = await getDb().query<{slug: string; updatedAt: Date | string}>('SELECT slug, updated_at AS "updatedAt" FROM blog_posts WHERE status = $1 ORDER BY published_at DESC, id DESC', ['published']);
    return result.rows.map(row => ({slug: row.slug, updatedAt: new Date(row.updatedAt).toISOString()}));
  } catch (error) {throw sanitize(error);}
}

export async function listAdminPosts(options: AdminPostOptions = {}): Promise<BlogPage> {
  await requireSuperAdmin();
  const page = valid(pageSchema, options.page, 'page'), limit = valid(limitSchema, options.limit ?? 20, 'limit');
  const status = options.status === undefined ? undefined : valid(z.enum(BLOG_POST_STATUSES), options.status, 'status');
  const query = valid(z.string().trim().max(200).default(''), options.query, 'query');
  const params: unknown[] = [], where: string[] = [];
  if (status) {params.push(status); where.push(`p.status = $${params.length}`);}
  if (query) {params.push(`%${query.replace(/[\\%_]/g, '\\$&')}%`); where.push(`(p.title ILIKE $${params.length} OR p.excerpt ILIKE $${params.length})`);}
  const filter = where.length ? `WHERE ${where.join(' AND ')}` : '';
  try {
    const [rows, count] = await Promise.all([
      getDb().query<PostRow>(`SELECT ${columns} ${fromPosts} ${filter} ORDER BY p.updated_at DESC, p.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, (page - 1) * limit]),
      getDb().query<{total: string}>(`SELECT COUNT(*) AS total FROM blog_posts p ${filter}`, params),
    ]);
    return {posts: rows.rows.map(summary), total: Number(count.rows[0].total)};
  } catch (error) {throw sanitize(error);}
}

export async function getAdminPost(id: string): Promise<BlogPost | null> {
  await requireSuperAdmin();
  valid(idSchema, id, 'post');
  try {
    const result = await getDb().query<PostRow>(`${fullSelect} WHERE p.id = $1`, [id]);
    return result.rows[0] ? post(result.rows[0]) : null;
  } catch (error) {throw sanitize(error);}
}

export async function saveBlogPost(input: SaveBlogPostInput): Promise<BlogPost> {
  const session = await requireSuperAdmin();
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BlogValidationError('Enter a valid post.');
  const id = input.id === undefined ? randomUUID() : valid(idSchema, input.id, 'post');
  const expectedVersion = input.id === undefined ? undefined : valid(versionSchema, input.expectedVersion, 'version');
  return transaction(async client => {
    const existing = input.id === undefined ? null : await readPost(client, id);
    if (existing && existing.version !== expectedVersion) throw new BlogConflictError();
    const value = validateBlogPostInput({...input, status: input.status ?? existing?.status ?? 'draft'});
    if (existing?.publishedAt && value.slug !== existing.slug) throw immutableSlugError();
    const fields = [value.slug, value.title, value.excerpt, value.content, value.category, value.coverImageUrl, value.coverImageAlt, value.seoTitle, value.seoDescription, value.status];
    if (existing) {
      const saved = await client.query<{version: number}>(`UPDATE blog_posts SET slug=$1, title=$2, excerpt=$3, content=$4, category=$5,
        cover_image_url=$6, cover_image_alt=$7, seo_title=$8, seo_description=$9, status=$10,
        published_at=CASE WHEN $10='published' THEN COALESCE(published_at,NOW()) ELSE published_at END,
        updated_at=NOW(), version=version+1 WHERE id=$11 AND version=$12 RETURNING version`, [...fields, id, expectedVersion]);
      if (!saved.rows[0]) throw new BlogConflictError();
      await audit(client, id, session.user.id, 'updated', existing.status, value.status, saved.rows[0].version);
    } else {
      await client.query(`INSERT INTO blog_posts (slug,title,excerpt,content,category,cover_image_url,cover_image_alt,seo_title,seo_description,status,id,author_id,published_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,CASE WHEN $10='published' THEN NOW() ELSE NULL END)`, [...fields, id, session.user.id]);
      await audit(client, id, session.user.id, 'created', null, value.status, 1);
    }
    return readPost(client, id);
  });
}

export async function setBlogPostStatus(id: string, status: BlogPostStatus, expectedVersion: number): Promise<BlogPost> {
  const session = await requireSuperAdmin();
  valid(idSchema, id, 'post');
  valid(z.enum(BLOG_POST_STATUSES), status, 'status');
  valid(versionSchema, expectedVersion, 'version');
  return transaction(async client => {
    const existing = await readPost(client, id);
    if (existing.version !== expectedVersion) throw new BlogConflictError();
    if (status === 'published') validateBlogPostInput({...existing, status});
    const saved = await client.query<{version: number}>(`UPDATE blog_posts SET status=$1,
      published_at=CASE WHEN $1='published' THEN COALESCE(published_at,NOW()) ELSE published_at END,
      updated_at=NOW(), version=version+1 WHERE id=$2 AND version=$3 RETURNING version`, [status, id, expectedVersion]);
    if (!saved.rows[0]) throw new BlogConflictError();
    await audit(client, id, session.user.id, 'status_changed', existing.status, status, saved.rows[0].version);
    return readPost(client, id);
  });
}
