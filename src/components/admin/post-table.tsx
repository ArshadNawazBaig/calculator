import Link from '@/components/document-link';
import type {BlogPostSummary} from '@/lib/blog/types';
import styles from './admin.module.css';

export function PostTable({posts}: {posts: BlogPostSummary[]}) {
  if (!posts.length) return <div className={styles.panel}><h2>No posts found</h2><p className={styles.muted}>Create a draft or change the filters to find an existing article.</p><Link className="button button-primary" href="/admin/posts/new">Write an article</Link></div>;
  return <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th scope="col">Article</th><th scope="col">Status</th><th scope="col">Updated (UTC)</th><th scope="col">Actions</th></tr></thead><tbody>{posts.map(post => <tr key={post.id}><td><Link href={`/admin/posts/${post.id}`}>{post.title || 'Untitled draft'}</Link><div className={styles.muted}>{post.category}</div></td><td><span className={`${styles.badge} ${post.status === 'published' ? styles.published : ''}`}>{post.status}</span></td><td>{new Intl.DateTimeFormat('en', {dateStyle: 'medium', timeZone: 'UTC'}).format(new Date(post.updatedAt))}</td><td><Link href={`/admin/posts/${post.id}/preview`}>Preview</Link>{post.status === 'published' && <> · <Link href={`/blog/${post.slug}`}>Live page</Link></>}</td></tr>)}</tbody></table></div>;
}
