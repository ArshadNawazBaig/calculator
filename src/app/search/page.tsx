import {PageHero} from '@/components/content/page-hero';
import {Suspense} from 'react';
import {SearchResults} from '@/components/content/search-results';
import {pageMetadata} from '@/lib/metadata';
export const metadata=pageMetadata('Search calculators','Find the right Finflo calculator for your question.','/search',false);
export default function Page(){return <><PageHero eyebrow="FIND YOUR NEXT TOOL" title="Search calculators" description="Find the calculation you need for money, health, math, and everyday life." breadcrumbs={[{label:'Search'}]}/><div className="container directory-page page-content"><Suspense fallback={<p>Loading search…</p>}><SearchResults/></Suspense></div></>;}
