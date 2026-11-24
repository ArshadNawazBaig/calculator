import Link from '@/components/document-link';
import type {BlogCategory, RelatedBlogPost} from '@/lib/blog/types';
import {blogCoverUrl, blogIndexPath, blogPostPath} from './blog-meta';
import styles from './blog.module.css';

export function RelatedPosts({category, posts}: {category: BlogCategory; posts: RelatedBlogPost[]}) {
  if (!posts.length) return null;
  const sameCategory = posts[0].category === category;

  return <section id="related-posts" aria-labelledby="related-posts-heading" className={styles.relatedPosts}>
    <header>
      <h2 id="related-posts-heading">{sameCategory ? 'Related posts' : 'More from the blog'}</h2>
      {sameCategory && <Link href={blogIndexPath(1,category)}>All {category} posts</Link>}
    </header>
    <ul>
      {posts.map(post => {
        const image = blogCoverUrl(post);
        const titleId = `related-title-${post.slug}`;
        return <li key={post.slug}>
          <Link href={blogPostPath(post.slug)} aria-labelledby={titleId} className={styles.relatedLink}>
            <div>
              {!sameCategory && <span className={styles.category}>{post.category}</span>}
              <h3 id={titleId}>{post.title}</h3>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {image && <img src={image} alt="" width={112} height={72} loading="lazy" decoding="async" referrerPolicy="no-referrer"/>}
          </Link>
        </li>;
      })}
    </ul>
  </section>;
}
