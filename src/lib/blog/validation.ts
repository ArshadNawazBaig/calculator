import {z} from 'zod';
import {fromMarkdown} from 'mdast-util-from-markdown';
import {BLOG_CATEGORIES, BLOG_POST_STATUSES, type BlogPostInput} from './types';

export class BlogValidationError extends Error {
  readonly fieldErrors: Record<string, string[]>;
  constructor(message = 'Check the highlighted post fields.', fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'BlogValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export const blogSlugSchema = z.string().trim().max(120, 'Use at most 120 characters for the URL slug.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens for the URL slug.');

/** HTTPS images or ordinary root-relative public asset paths; never an executable URL. */
export function isSafeBlogImageUrl(value: string): boolean {
  if (!value || /[\u0000-\u0020\u007f\\]/.test(value)) return false;
  if (value.startsWith('/')) {
    return /^\/(?!\/)[a-zA-Z0-9_~./-]+$/.test(value) && !value.split('/').some(part => part === '.' || part === '..');
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {return false;}
}

/** Visible CommonMark text, matching the renderer's decision to skip raw HTML. */
export function hasReadableBlogText(value: string): boolean {
  type ContentNode = {type: string; value?: string; children?: ContentNode[]};
  const pending: ContentNode[] = [fromMarkdown(value)];
  while (pending.length) {
    const node = pending.pop()!;
    if (node.type === 'html' || node.type === 'image' || node.type === 'imageReference' || node.type === 'definition') continue;
    if (['text', 'code', 'inlineCode'].includes(node.type) && /[\p{L}\p{N}]/u.test(node.value || '')) return true;
    if (node.children) pending.push(...node.children);
  }
  return false;
}

const imageSchema = z.union([z.string().trim().max(2048), z.null()]).optional()
  .transform(value => value || null)
  .refine(value => value === null || isSafeBlogImageUrl(value), 'Use an HTTPS image URL without credentials or a safe /path/to/image.');
const postShape = z.object({
  slug: blogSlugSchema,
  title: z.string().trim().max(160, 'Use at most 160 characters for the title.'),
  excerpt: z.string().trim().max(320, 'Use at most 320 characters for the excerpt.').default(''),
  content: z.string().max(100_000, 'The article is too long; use at most 100,000 characters.').default(''),
  category: z.enum(BLOG_CATEGORIES).default('Updates'),
  coverImageUrl: imageSchema,
  coverImageAlt: z.string().trim().max(300).default(''),
  seoTitle: z.string().trim().max(70, 'Use at most 70 characters for the SEO title.').default(''),
  seoDescription: z.string().trim().max(200, 'Use at most 200 characters for the SEO description.').default(''),
  status: z.enum(BLOG_POST_STATUSES).default('draft'),
}).superRefine((post, ctx) => {
  if (post.coverImageUrl && !hasReadableBlogText(post.coverImageAlt)) ctx.addIssue({code: 'custom', path: ['coverImageAlt'], message: 'Describe the cover image for readers who cannot see it.'});
  if (post.status === 'published') {
    for (const [field, label] of [['title', 'title'], ['excerpt', 'excerpt'], ['content', 'article body']] as const) {
      if (post[field].length <= 100_000 && !hasReadableBlogText(post[field])) ctx.addIssue({code: 'custom', path: [field], message: `Add readable text to the ${label} before publishing.`});
    }
  }
});

export const blogPostInputSchema = postShape;
export function validateBlogPostInput(input: unknown, options: {publishing?: boolean} = {}): BlogPostInput {
  const candidate = options.publishing && input && typeof input === 'object' ? {...input, status: 'published'} : input;
  const result = blogPostInputSchema.safeParse(candidate);
  if (result.success) return result.data;
  const fields: Record<string, string[]> = {};
  for (const issue of result.error.issues) (fields[String(issue.path[0] || 'post')] ??= []).push(issue.message);
  throw new BlogValidationError('Check the highlighted post fields.', fields);
}
