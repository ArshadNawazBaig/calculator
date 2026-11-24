import {ArrowRight} from 'lucide-react';
import Link from '@/components/document-link';
import {Button} from '@/components/ui/button';
import type {BlogPostSummary} from '@/lib/blog/types';
import {BlogByline} from './blog-byline';
import {blogCoverUrl,blogDate,blogPostPath} from './blog-meta';
import styles from './blog.module.css';

export function BlogCard({post}: {post:BlogPostSummary}) {
  const image=blogCoverUrl(post);
  const articlePath = blogPostPath(post.slug);
  return <article className={styles.card}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {image&&<img className={styles.cover} src={image} alt={post.coverImageAlt} loading="lazy" decoding="async" referrerPolicy="no-referrer"/>}
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
