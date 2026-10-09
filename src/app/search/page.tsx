import {PageHero} from '@/components/content/page-hero';
import {Suspense} from 'react';
import {SearchResults} from '@/components/content/search-results';
import {Breadcrumbs} from '@/components/content/breadcrumbs';
import {pageMetadata} from '@/lib/metadata';
export const metadata=pageMetadata('Search calculators','Find the right Finflo calculator for your question.','/search',false);
export default function Page(){return <><PageHero eyebrow="FIND YOUR NEXT TOOL" title="Search calculators" description="Find the calculation you need for money, health, math, and everyday life."/><div className="container directory-page page-content"><Breadcrumbs items={[{label:'Search'}]}/><Suspense fallback={<p>Loading search…</p>}><SearchResults/></Suspense></div></>;}
