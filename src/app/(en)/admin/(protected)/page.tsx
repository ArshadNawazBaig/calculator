import Link from '@/components/document-link';
import {Archive, ArrowRight, Check, Pencil, Plus} from 'lucide-react';
import {listAdminPosts} from '@/lib/server/blog';
import {requireAdminPageSession} from '@/lib/server/admin-page';
import {PostTable} from '@/components/admin/post-table';
import {AdminPageHeader} from '@/components/admin/admin-page-header';
import styles from '@/components/admin/admin.module.css';

export default async function AdminDashboard() {
  await requireAdminPageSession();
  const [recent, drafts, published, archived] = await Promise.all([listAdminPosts({limit: 5}), ...(['draft', 'published', 'archived'] as const).map(status => listAdminPosts({status, limit: 1}))]);
  const stats = [
    {label: 'Drafts', count: drafts.total, status: 'draft', Icon: Pencil, hint: 'Continue writing'},
    {label: 'Published', count: published.total, status: 'published', Icon: Check, hint: 'Review live articles'},
    {label: 'Archived', count: archived.total, status: 'archived', Icon: Archive, hint: 'Browse the archive'},
  ];
  return <>
    <AdminPageHeader title="Publishing dashboard" description="Helpful articles start with a clear question and a checked answer.">
      <Link className="button button-primary" href="/admin/posts/new"><Plus size={17} aria-hidden="true"/>Write an article</Link>
    </AdminPageHeader>
    <div className={styles.stats}>{stats.map(({label, count, status, Icon, hint}) => <Link className={styles.stat} key={status} href={`/admin/posts?status=${status}`}>
      <div><strong>{count}</strong><span className={styles.statLabel}>{label}</span></div>
      <span className={styles.statIcon}><Icon size={17} aria-hidden="true"/></span>
      <span className={styles.statHint}>{hint}<ArrowRight size={13} aria-hidden="true"/></span>
    </Link>)}</div>
    <section aria-labelledby="recent-posts-heading">
      <div className={styles.sectionHeader}><h2 id="recent-posts-heading">Recently updated</h2><Link href="/admin/posts">Manage all posts<ArrowRight size={15} aria-hidden="true"/></Link></div>
      <PostTable posts={recent.posts}/>
    </section>
    <aside className={`${styles.panel} ${styles.review}`}><h2>Before you publish</h2><ul><li>Give readers an original explanation, useful example or practical method.</li><li>Verify formulas, dates and factual claims against reliable sources; link the sources in the article.</li><li>Check links, image rights, alternative text and the mobile preview.</li><li>State assumptions and limitations. Publishing a blog alone does not establish AdSense eligibility.</li></ul></aside>
  </>;
}
