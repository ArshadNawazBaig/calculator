import Link from '@/components/document-link';
import type {BlogPostSummary} from '@/lib/blog/types';
import {blogDate,blogPostPath} from './blog-meta';
import {blogContentUrl} from './blog-markdown';
import styles from './blog.module.css';

export function BlogCard({post}: {post:BlogPostSummary}) {
  const image=post.coverImageUrl&&post.coverImageAlt?.trim()?blogContentUrl(post.coverImageUrl,true):undefined;
  return <article className={styles.card}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {image&&<img className={styles.cover} src={image} alt={post.coverImageAlt} loading="lazy" decoding="async" referrerPolicy="no-referrer"/>}
    <span className={styles.category}>{post.category}</span>
    <h2><Link href={blogPostPath(post.slug)}>{post.title}</Link></h2>
    <div className={styles.byline}>By {post.authorName}{post.publishedAt&&<> · <time dateTime={post.publishedAt}>{blogDate(post.publishedAt)}</time></>}</div>
    <p>{post.excerpt}</p><Link href={blogPostPath(post.slug)} aria-label={`Read ${post.title}`}>Read article</Link>
  </article>;
}
