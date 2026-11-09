import Link from '@/components/document-link';
import {listAdminPosts} from '@/lib/server/blog';
import {requireAdminPageSession} from '@/lib/server/admin-page';
import {PostTable} from '@/components/admin/post-table';
import styles from '@/components/admin/admin.module.css';

export default async function AdminDashboard() {
  await requireAdminPageSession();
  const [recent, drafts, published, archived] = await Promise.all([listAdminPosts({limit: 5}), ...(['draft', 'published', 'archived'] as const).map(status => listAdminPosts({status, limit: 1}))]);
  return <><div className={styles.top}><div><h1>Publishing dashboard</h1><p className={styles.muted}>Helpful articles start with a clear question and a checked answer.</p></div><Link className="button button-primary" href="/admin/posts/new">Write an article</Link></div><div className={styles.stats}>{[['Drafts', drafts.total, 'draft'], ['Published', published.total, 'published'], ['Archived', archived.total, 'archived']].map(([label, count, status]) => <Link className={styles.stat} key={label} href={`/admin/posts?status=${status}`}><strong>{count}</strong>{label}</Link>)}</div><section><div className={styles.top}><h2>Recently updated</h2><Link href="/admin/posts">Manage all posts</Link></div><PostTable posts={recent.posts}/></section><aside className={`${styles.panel} ${styles.review}`}><h2>Before you publish</h2><ul><li>Give readers an original explanation, useful example or practical method.</li><li>Verify formulas, dates and factual claims against reliable sources; link the sources in the article.</li><li>Check links, image rights, alternative text and the mobile preview.</li><li>State assumptions and limitations. Publishing a blog alone does not establish AdSense eligibility.</li></ul></aside></>;
}
