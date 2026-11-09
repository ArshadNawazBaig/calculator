import {beforeEach,afterEach,describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {BlogMarkdown,blogContentUrl} from '@/components/blog/blog-markdown';
import {BlogArticle} from '@/components/blog/blog-article';
import {blogArticleData,blogPostMetadata} from '@/components/blog/blog-meta';
import {BlogIndex,blogIndexPath} from '@/components/blog/blog-index';
import {site} from '@/lib/site';
import type {BlogPost} from '@/lib/blog/types';

const repository=vi.hoisted(()=>({list:vi.fn(),find:vi.fn(),sitemap:vi.fn()}));
vi.mock('@/lib/server/blog',()=>({listPublishedPosts:repository.list,findPublishedPostBySlug:repository.find,getPublishedPostSitemapEntries:repository.sitemap}));
vi.mock('next/server',()=>({connection:vi.fn(async()=>{})}));
vi.mock('next/navigation',()=>({notFound:()=>{throw Error('NEXT_NOT_FOUND');}}));
import BlogPage,{generateMetadata as indexMetadata} from '@/app/(en)/blog/page';
import PostPage,{generateMetadata as postMetadata} from '@/app/(en)/blog/[slug]/page';
import sitemap,{dynamic} from '@/app/sitemap';

const originalIndexing=site.indexable;
const post:BlogPost={id:'post-1',slug:'understanding-a-result',title:'Understanding a result',excerpt:'Check the units and assumptions before deciding what comes next.',content:'# A useful example\n\nUse the [percentage calculator](/percent-calculator).',category:'Math',coverImageUrl:'/og.png',coverImageAlt:'Finflo calculator example',seoTitle:'Understanding calculation results',seoDescription:'A practical example of checking units, rounding and assumptions.',status:'published',authorId:'author-1',authorName:'Actual author',publishedAt:'2026-11-01T09:00:00.000Z',createdAt:'2026-10-31T08:00:00.000Z',updatedAt:'2026-11-09T10:30:00.000Z',version:2};
beforeEach(()=>{site.indexable=true;repository.list.mockResolvedValue({posts:[],total:0});repository.find.mockResolvedValue(null);repository.sitemap.mockResolvedValue([]);});
afterEach(()=>{site.indexable=originalIndexing;vi.clearAllMocks();});

describe('safe shared Markdown rendering',()=>{
  it('renders useful Markdown while keeping one article H1 and escaping code',()=>{
    const html=renderToStaticMarkup(<BlogMarkdown content={'# Topic\n\n**Clear** examples and [a calculator](/percent-calculator).\n\n| Rate | Amount |\n| --- | --- |\n| 10% | 20 |\n\n```html\n<script>alert(1)</script>\n```'}/>);
    expect(html).toContain('<h2>Topic</h2>');expect(html).not.toContain('<h1');
    expect(html).toContain('<strong>Clear</strong>');expect(html).toContain('href="/percent-calculator"');
    expect(html).toContain('<table>');expect(html).toContain('role="region"');expect(html).toContain('&lt;script&gt;');
  });
  it('does not execute or render raw HTML, event handlers, frames or dangerous destinations',()=>{
    const html=renderToStaticMarkup(<BlogMarkdown content={'<script>alert(document.cookie)</script>\n\n<iframe src="https://evil.example"></iframe>\n\n<img src=x onerror=alert(1)>\n\n[bad](javascript:alert(1))\n\n[encoded](javascript&#58;alert)\n\n![bad](data:image/svg+xml,test)\n\n[safe](https://example.com/source)\n\n![Chart](/charts/example.png)'}/>);
    expect(html).not.toMatch(/<script|<iframe|onerror|javascript:|data:image|src="x"/i);
    expect(html).toContain('href="https://example.com/source"');expect(html).toContain('src="/charts/example.png"');expect(html).toContain('alt="Chart"');
  });
  it.each(['javascript:alert(1)','data:text/html,hello','//evil.example/x','/\\evil.example/x','https://user:password@example.com','https://example.com/\nwrong','ftp://example.com'])('rejects unsafe link destination %s',value=>{expect(blogContentUrl(value)).toBeUndefined();});
  it('allows explicit web/mailto and local links while requiring secure informative images',()=>{
    expect(blogContentUrl('mailto:contact@example.com')).toBe('mailto:contact@example.com');expect(blogContentUrl('#assumptions')).toBe('#assumptions');
    expect(blogContentUrl('http://example.com/chart.png',true)).toBeUndefined();expect(blogContentUrl('https://example.com/chart.png',true)).toBeTruthy();
    const html=renderToStaticMarkup(<BlogMarkdown content={'![](https://example.com/no-alt.png)\n\n![Helpful alt](http://example.com/insecure.png)'}/>);
    expect(html).not.toContain('<img');expect(html).not.toContain('src=');
  });
});

describe('published article presentation and metadata',()=>{
  it('uses actual byline and stored publication/modification dates without invented review data',()=>{
    const html=renderToStaticMarkup(<BlogArticle post={post}/>), metadata=blogPostMetadata(post), data=blogArticleData(post);
    expect((html.match(/<h1\b/g)||[])).toHaveLength(1);expect(html).toContain('By Actual author');expect(html).toContain('2026-11-01T09:00:00.000Z');expect(html).toContain('2026-11-09T10:30:00.000Z');
    expect(metadata.title).toEqual({absolute:post.seoTitle});expect(metadata.description).toBe(post.seoDescription);expect(metadata.alternates?.canonical).toBe('/blog/understanding-a-result');expect(metadata.openGraph).toMatchObject({type:'article',publishedTime:post.publishedAt,modifiedTime:post.updatedAt});
    expect(data).toMatchObject({'@type':'BlogPosting',author:{'@type':'Person',name:post.authorName},datePublished:post.publishedAt,dateModified:post.updatedAt});expect(data).not.toHaveProperty('reviewedBy');
  });
  it('escapes schema script boundaries even when author-supplied text contains markup',()=>{
    const html=renderToStaticMarkup(<BlogArticle post={{...post,title:'</script><script>alert(1)</script>'}}/>);
    expect(html).not.toContain('</script><script>alert');expect(html).toContain('\\u003c/script>');
  });
  it('returns notFound for a non-public slug rather than exposing a draft fallback',async()=>{
    const props={params:Promise.resolve({slug:'draft-secret'})};
    await expect(PostPage(props)).rejects.toThrow('NEXT_NOT_FOUND');await expect(postMetadata(props)).rejects.toThrow('NEXT_NOT_FOUND');
  });
});

describe('dynamic blog discovery and index behavior',()=>{
  it('keeps empty/unconfigured content noindex and links genuine existing guides',async()=>{
    const metadata=await indexMetadata({searchParams:Promise.resolve({})});
    expect(metadata.robots).toEqual({index:false,follow:true});
    const html=renderToStaticMarkup(await BlogPage({searchParams:Promise.resolve({})}));
    expect(html).toContain('href="/guides/understanding-mortgage-payments"');expect(html).not.toMatch(/under construction|coming soon|placeholder/i);
  });
  it('uses query filters and real pagination without indexed duplicate category pages',async()=>{
    repository.list.mockResolvedValue({posts:[post],total:25});
    const html=renderToStaticMarkup(<BlogIndex posts={[post]} total={25} page={2} category="Math"/>);
    expect(html).toContain('href="/blog?category=Math"');expect(html).toContain('href="/blog?category=Math&amp;page=3"');expect(html).toContain('Page 2 of 3');
    expect(blogIndexPath(1)).toBe('/blog');expect(blogIndexPath(2,'Health')).toBe('/blog?category=Health&page=2');
    expect((await indexMetadata({searchParams:Promise.resolve({category:'Math'})})).robots).toEqual({index:false,follow:true});
    expect((await indexMetadata({searchParams:Promise.resolve({})})).robots).toEqual({index:true,follow:true});
  });
  it('excludes an empty blog from XML but adds only repository-published entries at request time',async()=>{
    expect(dynamic).toBe('force-dynamic');
    const empty=await sitemap();expect(empty).toHaveLength(721);expect(empty.some(entry=>entry.url.includes('/blog'))).toBe(false);
    repository.sitemap.mockResolvedValue([{slug:post.slug,updatedAt:post.updatedAt}]);
    const published=await sitemap();expect(published).toHaveLength(723);expect(published).toContainEqual({url:site.url+'/blog'});expect(published).toContainEqual({url:site.url+'/blog/'+post.slug,lastModified:post.updatedAt});expect(published.some(entry=>entry.url.includes('/admin'))).toBe(false);
    repository.sitemap.mockResolvedValue([]);expect((await sitemap()).some(entry=>entry.url.includes('/blog'))).toBe(false);
  });
  it('propagates configured database failures instead of silently claiming an empty blog',async()=>{
    repository.list.mockRejectedValue(Error('The blog is temporarily unavailable. Please try again shortly.'));
    await expect(BlogPage({searchParams:Promise.resolve({})})).rejects.toThrow('temporarily unavailable');
    repository.sitemap.mockRejectedValue(Error('The blog is temporarily unavailable.'));
    await expect(sitemap()).rejects.toThrow('temporarily unavailable');
  });
});
