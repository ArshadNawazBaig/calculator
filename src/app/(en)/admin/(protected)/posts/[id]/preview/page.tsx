import Link from '@/components/document-link';
import {notFound} from 'next/navigation';
import {getAdminPost} from '@/lib/server/blog';
import {requireAdminPageSession} from '@/lib/server/admin-page';
import {BlogMarkdown} from '@/components/blog/blog-markdown';
import styles from '@/components/admin/admin.module.css';

export default async function PreviewPostPage({params}: {params: Promise<{id: string}>}) {
  await requireAdminPageSession();
  const {id} = await params;
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) notFound();
  const post = await getAdminPost(id);
  if (!post) notFound();
  return <><p className={styles.notice}>Private preview of the saved version. Status: {post.status}. <Link href={`/admin/posts/${post.id}`}>Return to editor</Link></p><article className={styles.panel}><p className={styles.eyebrow}>{post.category}</p><h1>{post.title || 'Untitled draft'}</h1><p className={styles.muted}>{post.excerpt}</p><p className={styles.muted}>By {post.authorName}</p>{/* External covers are deliberately ordinary images; never fetched by our server. */}{post.coverImageUrl &&
    // eslint-disable-next-line @next/next/no-img-element
    <img src={post.coverImageUrl} alt={post.coverImageAlt} referrerPolicy="no-referrer" style={{maxWidth: '100%', height: 'auto', borderRadius: 12}}/>}<BlogMarkdown content={post.content}/></article></>;
}
