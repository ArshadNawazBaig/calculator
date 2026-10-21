import {ToolChooser} from '@/components/content/tool-chooser';
import {PageHero} from '@/components/content/page-hero';
import Link from 'next/link';
import {guides} from '@/data/guides';
import {pageMetadata} from '@/lib/metadata';
export const metadata=pageMetadata('Calculation guides','Worked examples for discounts, grades, concrete quantities, mortgages, compound growth, and adult BMI.','/guides');
export default function Page(){return <><PageHero eyebrow="MORE THAN A NUMBER" title="Understand the answer." description="Short, practical guides to the ideas behind everyday calculations." breadcrumbs={[{label:'Guides'}]}/><div className="container directory-page page-content"><div className="guide-grid">{Object.entries(guides).map(([slug,guide])=><article className="guide-card" key={slug}><span className="eyebrow">THE FINFLO GUIDE</span><h2><Link href={`/guides/${slug}`}>{guide.title}</Link></h2><p>{guide.description}</p><Link className="text-link" href={`/guides/${slug}`}>Read the guide</Link></article>)}</div><ToolChooser slugs={['mortgage-calculator','compound-interest-calculator','bmi-calculator']}/></div></>;}
