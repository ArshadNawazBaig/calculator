import Link from '@/components/document-link';
import {Plus} from 'lucide-react';
import {BLOG_POST_STATUSES, type BlogPostStatus} from '@/lib/blog/types';
import {listAdminPosts} from '@/lib/server/blog';
import {requireAdminPageSession} from '@/lib/server/admin-page';
import {PostTable} from '@/components/admin/post-table';
import {PostFilters} from '@/components/admin/post-filters';
import {AdminPageHeader} from '@/components/admin/admin-page-header';
import styles from '@/components/admin/admin.module.css';

export default async function AdminPostsPage({searchParams}: {searchParams: Promise<Record<string, string | string[] | undefined>>}) {
  await requireAdminPageSession();
  const params = await searchParams;
  const status = BLOG_POST_STATUSES.includes(params.status as BlogPostStatus) ? params.status as BlogPostStatus : undefined;
  const query = typeof params.q === 'string' ? params.q.slice(0, 200) : '';
  const page = typeof params.page === 'string' && /^\d+$/.test(params.page) ? Math.min(100_000, Math.max(1, Number(params.page))) : 1;
  const result = await listAdminPosts({status, query, page, limit: 20});
  function pageLink(target: number) {const values = new URLSearchParams({page: String(target)}); if (status) values.set('status', status); if (query) values.set('q', query); return `/admin/posts?${values}`;}
  return <>
    <AdminPageHeader title="All posts" description={`${result.total} ${result.total === 1 ? 'article' : 'articles'}. Find a draft, review a published article or revisit the archive.`}>
      <Link className="button button-primary" href="/admin/posts/new"><Plus size={17} aria-hidden="true"/>Write an article</Link>
    </AdminPageHeader>
    <PostFilters query={query} status={status}/>
    <PostTable posts={result.posts}/>
    <nav className={styles.pagination} aria-label="Post list pages">{page > 1 && <Link href={pageLink(page - 1)}>Previous</Link>}<span>Page {page} of {Math.max(1, Math.ceil(result.total / 20))}</span>{page * 20 < result.total && <Link href={pageLink(page + 1)}>Next</Link>}</nav>
  </>;
}
