import {PageHero} from '@/components/content/page-hero';
import Link from 'next/link';
import {catalog} from '@/lib/calculators/registry';
import {information} from '@/data/information';
import {guides} from '@/data/guides';
import {categories} from '@/lib/site';
import {pageMetadata} from '@/lib/metadata';
import {ToolDirectory} from '@/components/content/tool-directory';
export const metadata=pageMetadata('Sitemap','Browse Finflo’s calculators, categories, guides, and website information.','/sitemap');
export default function Page(){return <><PageHero eyebrow="FIND YOUR WAY" title="Finflo sitemap" description="Explore every calculator, category, guide, and information page in one place."/><div className="container directory-page page-content"><div className="document-body"><h2>Website information</h2><ul><li><Link href="/">Home</Link></li><li><Link href="/calculators">All calculators</Link></li><li><Link href="/guides">Calculation guides</Link></li>{Object.entries(information).map(([slug,page])=><li key={slug}><Link href={`/${slug}`}>{slug==='about'?'About':page.title}</Link></li>)}{Object.entries(guides).map(([slug,page])=><li key={slug}><Link href={`/guides/${slug}`}>{page.title}</Link></li>)}</ul></div>{categories.map(c=><section key={c.id} className="category-directory"><div className="section-heading"><h2><Link href={`/calculators/${c.id}`}>{c.label}</Link></h2></div><ToolDirectory tools={catalog.filter(t=>t.category===c.id)}/></section>)}</div></>;}
