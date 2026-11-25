import Image from 'next/image';
import Link from '@/components/document-link';
import {notFound} from 'next/navigation';
import {blogImageProps} from '@/lib/blog/image-props';
import {getAdminPost} from '@/lib/server/blog';
import {requireAdminPageSession} from '@/lib/server/admin-page';
import {BlogByline} from '@/components/blog/blog-byline';
import {BlogMarkdown} from '@/components/blog/blog-markdown';
import {blogCoverUrl} from '@/components/blog/blog-meta';
import {AdminPageHeader} from '@/components/admin/admin-page-header';
import styles from '@/components/admin/admin.module.css';

export default async function PreviewPostPage({params}: {params: Promise<{id: string}>}) {
  await requireAdminPageSession();
  const {id} = await params;
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) notFound();
  const post = await getAdminPost(id);
  if (!post) notFound();
  const cover = blogCoverUrl(post);
  return <>
    <p className={styles.notice}>Private preview of the saved version. Status: {post.status}.</p>
    <AdminPageHeader eyebrow={post.category} title={post.title || 'Untitled draft'} description={post.excerpt}>
      <Link className="button button-secondary" href={`/admin/posts/${post.id}`}>Return to editor</Link>
    </AdminPageHeader>
    <article className={`${styles.panel} ${styles.articlePreview}`}>
      <div className={styles.previewByline}><BlogByline authorName={post.authorName}/></div>
      {cover && <Image {...blogImageProps(cover)} alt={post.coverImageAlt} className={styles.previewCover}
        sizes="(max-width: 900px) calc(100vw - 80px), 790px"/>}
      <BlogMarkdown content={post.content}/>
    </article>
  </>;
}
