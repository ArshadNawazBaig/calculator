import {StudentTools} from '@/components/content/student-tools';
import {TimeCollection} from '@/components/time/time-collection';
import {WheelCollection} from '@/components/spin-wheels/wheel-collection';
import {CategoryNavigation} from '@/components/content/category-navigation';
import {DirectoryGuidance, directoryContent} from '@/components/content/directory-guidance';
import {SearchHero} from '@/components/content/search-hero';
import Link from '@/components/document-link';
import {catalog} from '@/lib/calculators/registry';
import {categories} from '@/lib/site';
import {pageMetadata} from '@/lib/metadata';
import {ToolDirectory} from '@/components/content/tool-directory';
export const metadata=pageMetadata('All calculators',directoryContent['/calculators'].description,'/calculators');
export default function Page(){return <><SearchHero compact id="directory-title" eyebrow="THE CALCULATOR LIBRARY" title="All calculators" highlight="calculators" description="Free calculators for money, health, math, and everyday life. Find the right tool for your next question."/><div className="container directory-page page-content"><CategoryNavigation/><StudentTools/>{categories.map(c=><section className="category-directory" id={c.id} key={c.id}><div className="section-heading"><div><span className="eyebrow">{c.description}</span><h2>{c.name}</h2></div><Link href={`/calculators/${c.id}`} className="text-link">Explore {c.name.toLowerCase()}</Link></div><ToolDirectory tools={catalog.filter(t=>t.category===c.id)}/></section>)}<WheelCollection/><TimeCollection/><DirectoryGuidance path="/calculators"/></div></>;}
