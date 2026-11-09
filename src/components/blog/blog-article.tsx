import Link from '@/components/document-link';
import type {BlogPost} from '@/lib/blog/types';
import {PageHero} from '@/components/content/page-hero';
import {JsonLd} from '@/components/content/json-ld';
import {breadcrumbData} from '@/lib/structured-data';
import {BlogMarkdown,blogContentUrl} from './blog-markdown';
import {blogArticleData,blogDate,blogPostPath} from './blog-meta';
import styles from './blog.module.css';

export function BlogArticle({post}: {post:BlogPost}) {
  const image=post.coverImageUrl&&post.coverImageAlt?.trim()?blogContentUrl(post.coverImageUrl,true):undefined;
  const updated=post.publishedAt&&new Date(post.updatedAt).getTime()>new Date(post.publishedAt).getTime()+1000;
  return <>
    <PageHero eyebrow={`FINFLO BLOG · ${post.category.toUpperCase()}`} title={post.title} description={post.excerpt} breadcrumbs={[{label:'Blog',href:'/blog'},{label:post.title}]}/>
    <div className={`container document-page page-content ${styles.article}`}><article aria-label={post.title}>
      <div className={styles.byline}><span>By {post.authorName}</span>{post.publishedAt&&<span>Published <time dateTime={post.publishedAt}>{blogDate(post.publishedAt)}</time></span>}{updated&&<span>Updated <time dateTime={post.updatedAt}>{blogDate(post.updatedAt)}</time></span>}</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {image&&<img className={styles.cover} src={image} alt={post.coverImageAlt} decoding="async" referrerPolicy="no-referrer"/>}
      <BlogMarkdown content={post.content}/>
      <footer className={styles.articleFooter}><p>Read our <Link href="/editorial-policy">editorial policy</Link> and <Link href="/disclaimer">limitations on professional advice</Link>. If you find an error, <Link href="/contact">send a correction</Link>.</p><p><Link href="/blog">Browse articles</Link> · <Link href="/guides">Explore calculation guides</Link> · <Link href="/calculators">Find a calculator</Link></p></footer>
    </article></div>
    <JsonLd data={blogArticleData(post)}/><JsonLd data={breadcrumbData([{name:'Home',path:'/'},{name:'Blog',path:'/blog'},{name:post.title,path:blogPostPath(post.slug)}])}/>
  </>;
}
