import Link from 'next/link';
import {guides} from '@/data/guides';
import {pageMetadata} from '@/lib/metadata';
import {Breadcrumbs} from '@/components/content/breadcrumbs';
export const metadata=pageMetadata('Calculation guides','Understand the assumptions behind mortgages, compound growth, and adult BMI.','/guides');
export default function Page(){return <div className="container directory-page"><Breadcrumbs items={[{label:'Guides'}]}/><header className="page-heading"><span className="eyebrow">MORE THAN A NUMBER</span><h1>Understand the answer.</h1><p>Short, practical guides to the ideas behind everyday calculations.</p></header><div className="guide-grid">{Object.entries(guides).map(([slug,guide])=><article className="guide-card" key={slug}><span className="eyebrow">THE FINFLO GUIDE</span><h2><Link href={`/guides/${slug}`}>{guide.title}</Link></h2><p>{guide.description}</p><Link className="text-link" href={`/guides/${slug}`}>Read the guide</Link></article>)}</div></div>;}
