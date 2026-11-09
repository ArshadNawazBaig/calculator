import Link from '@/components/document-link';
import {notFound} from 'next/navigation';
import {getAdminPost} from '@/lib/server/blog';
import {requireAdminPageSession} from '@/lib/server/admin-page';
import {BlogMarkdown} from '@/components/blog/blog-markdown';
import {AdminPageHeader} from '@/components/admin/admin-page-header';
import styles from '@/components/admin/admin.module.css';

export default async function PreviewPostPage({params}: {params: Promise<{id: string}>}) {
  await requireAdminPageSession();
  const {id} = await params;
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) notFound();
  const post = await getAdminPost(id);
  if (!post) notFound();
  return <>
    <p className={styles.notice}>Private preview of the saved version. Status: {post.status}.</p>
    <AdminPageHeader eyebrow={post.category} title={post.title || 'Untitled draft'} description={post.excerpt}>
      <Link className="button button-secondary" href={`/admin/posts/${post.id}`}>Return to editor</Link>
    </AdminPageHeader>
    <article className={`${styles.panel} ${styles.articlePreview}`}><p className={styles.previewByline}>By {post.authorName}</p>{/* External covers are deliberately ordinary images; never fetched by our server. */}{post.coverImageUrl &&
    // eslint-disable-next-line @next/next/no-img-element
    <img src={post.coverImageUrl} alt={post.coverImageAlt} referrerPolicy="no-referrer" className={styles.previewCover}/>}
      <BlogMarkdown content={post.content}/>
    </article>
  </>;
}
