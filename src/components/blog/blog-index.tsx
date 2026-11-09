import Link from '@/components/document-link';
import type {BlogPostSummary} from '@/lib/blog/types';
import {BlogCard} from './blog-card';
import {BlogGuides} from './blog-guides';
import {blogCategories,type PublicBlogCategory} from './blog-meta';
import styles from './blog.module.css';

export function blogIndexPath(page=1,category?:PublicBlogCategory) {
  const query=new URLSearchParams();
  if (category) query.set('category',category);
  if (page>1) query.set('page',String(page));
  return '/blog'+(query.size?'?'+query.toString():'');
}

export function BlogIndex({posts,total,page,category}: {posts:BlogPostSummary[];total:number;page:number;category?:PublicBlogCategory}) {
  const pages=Math.ceil(total/12);
  return <div className={`container directory-page page-content ${styles.index}`}>
    <nav className={styles.filters} aria-label="Article topics"><Link href="/blog" aria-current={!category?'page':undefined}>All topics</Link>{blogCategories.map(value=><Link key={value} href={blogIndexPath(1,value)} aria-current={value===category?'page':undefined}>{value}</Link>)}</nav>
    {posts.length?<>
      <p className={styles.count}>{total} {total===1?'article':'articles'}{category?` in ${category}`:''} · Page {page} of {pages}</p>
      <div className={styles.grid}>{posts.map(post=><BlogCard key={post.id} post={post}/>)}</div>
      {pages>1&&<nav className={styles.pagination} aria-label="Article pages">{page>1?<Link href={blogIndexPath(page-1,category)} rel="prev">Previous articles</Link>:<span/>}<span>Page {page} of {pages}</span>{page<pages?<Link href={blogIndexPath(page+1,category)} rel="next">Next articles</Link>:<span/>}</nav>}
    </>:<BlogGuides filtered={Boolean(category)}/>}
  </div>;
}
