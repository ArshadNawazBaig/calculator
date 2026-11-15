import {ToolChooser} from '@/components/content/tool-chooser';
import {PageHero} from '@/components/content/page-hero';
import Link from '@/components/document-link';
import {guides} from '@/data/guides';
import {pageMetadata} from '@/lib/metadata';
export const metadata=pageMetadata('Calculation Guides: Worked Examples and Comparisons','Worked examples for ratios, salary offers, loan fees, elapsed time, discounts, grades and more. Compare assumptions and reproduce each calculation.','/guides');
export default function Page(){return <><PageHero eyebrow="MORE THAN A NUMBER" title="Understand the answer." description="Follow worked examples, compare assumptions, and check the results in the matching calculator." breadcrumbs={[{label:'Guides'}]}/><div className="container directory-page page-content"><div className="guide-grid">{Object.entries(guides).map(([slug,guide])=><article className="guide-card" key={slug}><span className="eyebrow">THE FINFLO GUIDE</span><h2><Link href={`/guides/${slug}`}>{guide.title}</Link></h2><p>{guide.description}</p><Link className="text-link" href={`/guides/${slug}`}>Read the guide</Link></article>)}</div><ToolChooser slugs={['ratio-calculator','salary-calculator','apr-calculator','time-duration-calculator']}/></div></>;}
