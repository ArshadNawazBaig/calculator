import Link from '@/components/document-link';
import {blogPostPath} from './blog-meta';
import styles from './blog.module.css';

export function BlogSitemap({posts}: {posts:{slug:string;updatedAt:string}[]}) {
  if (!posts.length) return null;
  return <section className={styles.sitemap}><h2><Link href="/blog">Blog articles</Link></h2><nav aria-label="Blog sitemap"><ul>{posts.map(post=><li key={post.slug}><Link href={blogPostPath(post.slug)}>{post.slug.replace(/-/g,' ')}</Link></li>)}</ul></nav></section>;
}
