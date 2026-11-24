import {beforeEach,afterEach,describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {BlogMarkdown,blogContentUrl} from '@/components/blog/blog-markdown';
import {BlogArticle} from '@/components/blog/blog-article';
import {blogArticleData,blogPostMetadata} from '@/components/blog/blog-meta';
import {BlogIndex,blogIndexPath} from '@/components/blog/blog-index';
import {site} from '@/lib/site';
import type {BlogPost} from '@/lib/blog/types';

const repository=vi.hoisted(()=>({list:vi.fn(),find:vi.fn(),related:vi.fn(),sitemap:vi.fn()}));
vi.mock('@/lib/server/blog',()=>({BlogUnavailableError:class extends Error {},listPublishedPosts:repository.list,findPublishedPostBySlug:repository.find,listRelatedPublishedPosts:repository.related,getPublishedPostSitemapEntries:repository.sitemap}));
vi.mock('next/server',()=>({connection:vi.fn(async()=>{})}));
vi.mock('next/navigation',()=>({notFound:()=>{throw Error('NEXT_NOT_FOUND');}}));
import BlogPage,{generateMetadata as indexMetadata} from '@/app/(en)/blog/page';
import PostPage,{generateMetadata as postMetadata} from '@/app/(en)/blog/[slug]/page';
import {BlogUnavailableError} from '@/lib/server/blog';
import sitemap,{dynamic} from '@/app/sitemap';

const originalIndexing=site.indexable;
const post:BlogPost={id:'post-1',slug:'understanding-a-result',title:'Understanding a result',excerpt:'Check the units and assumptions before deciding what comes next.',content:'# A useful example\n\nUse the [percentage calculator](/percent-calculator).',category:'Math',coverImageUrl:'/og.png',coverImageAlt:'Finflo calculator example',seoTitle:'Understanding calculation results',seoDescription:'A practical example of checking units, rounding and assumptions.',status:'published',authorId:'author-1',authorName:'Actual author',publishedAt:'2026-11-01T09:00:00.000Z',createdAt:'2026-10-31T08:00:00.000Z',updatedAt:'2026-11-09T10:30:00.000Z',version:2};
beforeEach(()=>{site.indexable=true;repository.list.mockResolvedValue({posts:[],total:0});repository.find.mockResolvedValue(null);repository.related.mockResolvedValue([]);repository.sitemap.mockResolvedValue([]);});
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
    expect(data).toMatchObject({'@type':'BlogPosting',datePublished:post.publishedAt,dateModified:post.updatedAt});expect(data).not.toHaveProperty('reviewedBy');
    expect(data.author).toEqual({'@type':'Person',name:post.authorName});
    expect(html).not.toContain('/avatars/finflo-blog-writer.png');
  });
  it.each(['Finflo administrator', 'Erush'])('shows the Erush profile for %s across the blog and article metadata', authorName => {
    const article = {...post, authorName};
    const avatar = '/avatars/finflo-blog-writer.png';
    for (const html of [
      renderToStaticMarkup(<BlogArticle post={article}/>),
      renderToStaticMarkup(<BlogIndex posts={[article]} total={1} page={1}/>),
    ]) {
      expect(html).toContain('>Erush</strong>');
      expect(html).toContain('CFO at Finflo');
      expect(html).toContain(`src="${avatar}"`);
      expect(html).not.toContain('Finflo administrator');
    }
    const metadata = blogPostMetadata(article);
    expect(metadata.authors).toEqual([{name:'Erush'}]);
    expect(metadata.openGraph).toMatchObject({authors:['Erush']});
    const data = blogArticleData(article);
    expect(data.author).toMatchObject({
      '@type':'Person', name:'Erush', jobTitle:'CFO',
      image:new URL(avatar,site.url).href, worksFor:{'@id':data.publisher['@id']},
    });
  });
  it('escapes schema script boundaries even when author-supplied text contains markup',()=>{
    const html=renderToStaticMarkup(<BlogArticle post={{...post,title:'</script><script>alert(1)</script>'}}/>);
    expect(html).not.toContain('</script><script>alert');expect(html).toContain('\\u003c/script>');
  });
  it('puts distinct linked calculators first and fills the sidebar with related tools', () => {
    const content = [
      '[Outside source](https://example.org/bmi-calculator) and `[code](/age-calculator)`.',
      '[Room area][floor] and [another mode](https://finflo.org/area-calculator#mode-circle).',
      'https://finflo.org/volume-calculator',
      '[floor]: /area-calculator/?units=feet',
      '[unused]: /retirement-calculator',
    ].join('\n\n');
    const html = renderToStaticMarkup(<BlogArticle post={{...post, content}}/>);
    const sidebar = html.split('<aside')[1].split('</aside>')[0];
    expect([...sidebar.matchAll(/data-calculator-card="([^"]+)"/g)].map(match => match[1])).toEqual([
      'area-calculator', 'volume-calculator', 'square-footage-calculator', 'triangle-calculator',
    ]);
    expect(sidebar).toContain('>Related calculators</h2>');
    expect(sidebar).toContain('href="/area-calculator"');
    expect(sidebar).toContain('Add Area Calculator to favorites');
  });
  it.each([
    ['Finance', 'What to measure before retirement', 'Related calculators', 'retirement-calculator'],
    ['Health', 'A general health update', 'Related calculators', 'body-fat-calculator'],
    ['Updates', 'An update to our blog', 'Featured calculators', 'compound-interest-calculator'],
  ] as const)('selects calculators for an unlinked %s article', (category, title, heading, first) => {
    const html = renderToStaticMarkup(<BlogArticle post={{...post, category, title, content:'An update for readers.'}}/>);
    const sidebar = html.split('<aside')[1].split('</aside>')[0];
    expect(sidebar).toContain(`>${heading}</h2>`);
    expect(sidebar.match(/data-calculator-card="([^"]+)"/)?.[1]).toBe(first);
  });
  it('returns notFound for a non-public slug rather than exposing a draft fallback',async()=>{
    const props={params:Promise.resolve({slug:'draft-secret'})};
    await expect(PostPage(props)).rejects.toThrow('NEXT_NOT_FOUND');await expect(postMetadata(props)).rejects.toThrow('NEXT_NOT_FOUND');
    expect(repository.related).not.toHaveBeenCalled();
  });
  it.each([['Math','Related posts'],['Health','More from the blog']])('renders links below the article with the correct heading for %s suggestions',async(category,heading)=>{
    repository.find.mockResolvedValue(post);
    repository.related.mockResolvedValue([{slug:'next-article',title:'Next article',category,coverImageUrl:'http://example.com/insecure.png',coverImageAlt:'Example'}]);
    const html=renderToStaticMarkup(await PostPage({params:Promise.resolve({slug:post.slug})}));
    const section=html.slice(html.indexOf('id="related-posts"')).split('</section>')[0];
    expect(html.indexOf('id="related-posts"')).toBeGreaterThan(html.indexOf('</footer>'));
    expect(section).toContain(`>${heading}</h2>`);
    expect(section.includes('href="/blog?category=Math"')).toBe(category===post.category);
    expect(section).toContain('href="/blog/next-article"');
    expect(section).toContain('>Next article</h3>');
    expect(section).not.toContain('<img');
  });
  it('keeps the article readable when it is the only post or related posts are unavailable',async()=>{
    repository.find.mockResolvedValue(post);
    repository.related.mockResolvedValueOnce([]).mockRejectedValueOnce(new BlogUnavailableError());
    for(let i=0;i<2;i++){
      const html=renderToStaticMarkup(await PostPage({params:Promise.resolve({slug:post.slug})}));
      expect(html).toContain('By Actual author');
      expect(html).not.toContain('id="related-posts"');
    }
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
    const empty=await sitemap();expect(empty.length).toBeGreaterThan(0);expect(empty.some(entry=>entry.url.includes('/blog'))).toBe(false);
    repository.sitemap.mockResolvedValue([{slug:post.slug,updatedAt:post.updatedAt}]);
    const published=await sitemap();expect(published).toHaveLength(empty.length+2);expect(published.filter(entry=>!entry.url.includes('/blog'))).toEqual(empty);expect(published).toContainEqual({url:site.url+'/blog'});expect(published).toContainEqual({url:site.url+'/blog/'+post.slug,lastModified:post.updatedAt});expect(published.some(entry=>entry.url.includes('/admin'))).toBe(false);
    repository.sitemap.mockResolvedValue([]);expect((await sitemap()).some(entry=>entry.url.includes('/blog'))).toBe(false);
  });
  it('propagates configured database failures instead of silently claiming an empty blog',async()=>{
    repository.list.mockRejectedValue(Error('The blog is temporarily unavailable. Please try again shortly.'));
    await expect(BlogPage({searchParams:Promise.resolve({})})).rejects.toThrow('temporarily unavailable');
    repository.sitemap.mockRejectedValue(Error('The blog is temporarily unavailable.'));
    await expect(sitemap()).rejects.toThrow('temporarily unavailable');
  });
});
