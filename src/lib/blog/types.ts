/** Browser-safe contracts shared by blog pages, forms and the server repository. */
export const BLOG_CATEGORIES = ['Finance', 'Health', 'Math', 'Everyday', 'Updates'] as const;
export const BLOG_POST_STATUSES = ['draft', 'published', 'archived'] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
export type BlogPostStatus = (typeof BLOG_POST_STATUSES)[number];

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: BlogCategory;
  coverImageUrl: string | null;
  coverImageAlt: string;
  seoTitle: string;
  seoDescription: string;
  status: BlogPostStatus;
  authorId: string;
  authorName: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};
export type BlogPostSummary = Omit<BlogPost, 'content'>;
export type BlogPostInput = Pick<BlogPost,
  'slug' | 'title' | 'excerpt' | 'content' | 'category' | 'coverImageUrl' |
  'coverImageAlt' | 'seoTitle' | 'seoDescription' | 'status'>;
/** Omitted status preserves an existing post's state; new posts default to draft. */
export type SaveBlogPostInput = Omit<BlogPostInput, 'status'> & {
  id?: string;
  expectedVersion?: number;
  status?: BlogPostStatus;
};
export type BlogPage<T = BlogPostSummary> = {posts: T[]; total: number};
export type PublishedPostOptions = {page?: number; limit?: number; category?: BlogCategory};
export type AdminPostOptions = {page?: number; limit?: number; status?: BlogPostStatus; query?: string};
