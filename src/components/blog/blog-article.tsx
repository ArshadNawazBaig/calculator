import Image from 'next/image';
import Link from '@/components/document-link';
import {blogImageProps} from '@/lib/blog/image-props';
import type {BlogPost,RelatedBlogPost} from '@/lib/blog/types';
import {CalculatorCard} from '@/components/calculators/calculator-card';
import {PageHero} from '@/components/content/page-hero';
import {JsonLd} from '@/components/content/json-ld';
import {calculatorCardData} from '@/lib/calculator-cards';
import {breadcrumbData} from '@/lib/structured-data';
import {articleCalculators} from './article-calculators';
import {ArticleCalculatorSidebar} from './article-calculator-sidebar';
import {BlogByline} from './blog-byline';
import {BlogMarkdown} from './blog-markdown';
import {blogArticleData,blogCoverUrl,blogDate,blogPostPath} from './blog-meta';
import {RelatedPosts} from './related-posts';
import styles from './blog.module.css';

export function BlogArticle({post,relatedPosts=[]}: {post:BlogPost;relatedPosts?:RelatedBlogPost[]}) {
  const image=blogCoverUrl(post);
  const calculators = articleCalculators(post);
  const updated=post.publishedAt&&new Date(post.updatedAt).getTime()>new Date(post.publishedAt).getTime()+1000;
  return <>
    <div className={styles.articlePage}>
      <PageHero eyebrow={`FINFLO BLOG · ${post.category.toUpperCase()}`} title={post.title} description={post.excerpt} breadcrumbs={[{label:'Blog',href:'/blog'},{label:post.title}]}/>
      <div className={`container document-page page-content ${styles.articleBody}`}>
        <article className={styles.article} aria-labelledby="page-title">
          <BlogByline authorName={post.authorName}>
            {post.publishedAt && <>
              <span>Published <time dateTime={post.publishedAt}>{blogDate(post.publishedAt)}</time></span>
              {updated && <span>Updated <time dateTime={post.updatedAt}>{blogDate(post.updatedAt)}</time></span>}
            </>}
          </BlogByline>
          {image && <Image {...blogImageProps(image)} alt={post.coverImageAlt} className={styles.cover}/>}
          <BlogMarkdown content={post.content} articleTitle={post.title}/>
          <footer className={styles.articleFooter}><p>Read our <Link href="/editorial-policy">editorial policy</Link> and <Link href="/disclaimer">limitations on professional advice</Link>. If you find an error, <Link href="/contact">send a correction</Link>.</p><p><Link href="/blog">Browse articles</Link> · <Link href="/guides">Explore calculation guides</Link> · <Link href="/calculators">Find a calculator</Link></p></footer>
        </article>
        <ArticleCalculatorSidebar heading={calculators.heading}>
          {calculators.tools.map(tool => <CalculatorCard key={tool.slug} tool={calculatorCardData(tool)} size="compact"/>)}
        </ArticleCalculatorSidebar>
        <RelatedPosts category={post.category} posts={relatedPosts}/>
      </div>
    </div>
    <JsonLd data={blogArticleData(post)}/><JsonLd data={breadcrumbData([{name:'Home',path:'/'},{name:'Blog',path:'/blog'},{name:post.title,path:blogPostPath(post.slug)}])}/>
  </>;
}
