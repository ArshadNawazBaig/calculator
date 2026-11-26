import Image from 'next/image';
import Link from '@/components/document-link';
import {blogImageProps} from '@/lib/blog/image-props';
import {site} from '@/lib/site';
import type {BlogCategory, RelatedBlogPost} from '@/lib/blog/types';
import {blogCoverUrl, blogIndexPath, blogPostPath} from './blog-meta';
import styles from './blog.module.css';

function RelatedThumbnail({src}: {src: string}) {
  const url = new URL(src, site.url);
  if (url.origin === 'https://images.unsplash.com' && !url.searchParams.has('s')) {
    const rendition = (width: number) => {
      const image = new URL(url);
      image.searchParams.set('w', String(width));
      image.searchParams.set('h', String(width * 72 / 112));
      image.searchParams.set('fit', 'crop');
      image.searchParams.delete('dpr');
      return image.href;
    };
    const small = rendition(112);
    // Unsplash serves these renditions directly, including the browser's preferred format.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={small} srcSet={`${small} 112w, ${rendition(224)} 224w`} sizes="auto, 112px"
      width={112} height={72} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer"/>;
  }
  return <Image {...blogImageProps(src)} alt="" width={112} height={72} sizes="auto, 112px"/>;
}

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
            {image && <RelatedThumbnail src={image}/>}
          </Link>
        </li>;
      })}
    </ul>
  </section>;
}
