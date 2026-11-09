import {connection} from 'next/server';
import {getPublishedPostSitemapEntries} from '@/lib/server/blog';
import {BlogSitemap} from '@/components/blog/blog-sitemap';
import {SitemapIndex} from '@/components/content/sitemap-index';
import {TimeCollection} from '@/components/time/time-collection';
import {WheelCollection} from '@/components/spin-wheels/wheel-collection';
import {PageHero} from '@/components/content/page-hero';
import Link from '@/components/document-link';
import {catalog} from '@/lib/calculators/registry';
import {categories} from '@/lib/site';
import {pageMetadata} from '@/lib/metadata';
import {ToolDirectory} from '@/components/content/tool-directory';
export const metadata=pageMetadata('Sitemap','Browse Finflo’s calculators, categories, guides, and website information.','/sitemap');
export default async function Page(){await connection();const posts=await getPublishedPostSitemapEntries();return <><PageHero breadcrumbs={[{label:'Sitemap'}]} eyebrow="FIND YOUR WAY" title="Finflo sitemap" description="Explore every calculator, category, guide, and information page in one place."/><div className="container directory-page page-content"><SitemapIndex/><BlogSitemap posts={posts}/>{categories.map(c=><section key={c.id} className="category-directory"><div className="section-heading"><h2><Link href={`/calculators/${c.id}`}>{c.label}</Link></h2></div><ToolDirectory tools={catalog.filter(t=>t.category===c.id)}/></section>)}<WheelCollection/><TimeCollection/></div></>;}
