import Image from 'next/image';
import {ArrowRight} from 'lucide-react';
import Link from '@/components/document-link';
import {Button} from '@/components/ui/button';
import {blogImageProps} from '@/lib/blog/image-props';
import type {BlogPostSummary} from '@/lib/blog/types';
import {BlogByline} from './blog-byline';
import {blogCoverUrl,blogDate,blogPostPath} from './blog-meta';
import styles from './blog.module.css';

export function BlogCard({post}: {post:BlogPostSummary}) {
  const image=blogCoverUrl(post);
  const articlePath = blogPostPath(post.slug);
  return <article className={styles.card}>
    {image && <Image {...blogImageProps(image)} alt={post.coverImageAlt} className={styles.cover}
      sizes="auto, (max-width: 650px) calc(100vw - 78px), (max-width: 1000px) calc(50vw - 80px), (max-width: 1344px) calc(33vw - 90px), 352px"/>}
    <span className={styles.category}>{post.category}</span>
    <h2><Link href={articlePath}>{post.title}</Link></h2>
    <BlogByline authorName={post.authorName}>
      {post.publishedAt && <time dateTime={post.publishedAt}>{blogDate(post.publishedAt)}</time>}
    </BlogByline>
    <p>{post.excerpt}</p>
    <form className={styles.cardAction} action={articlePath} method="get">
      <Button type="submit" aria-label={`Read article “${post.title}”`}>
        Read article <ArrowRight size={16} aria-hidden="true"/>
      </Button>
    </form>
  </article>;
}
