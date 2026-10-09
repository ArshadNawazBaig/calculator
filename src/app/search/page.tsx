import {Suspense} from 'react';
import {SearchResults} from '@/components/content/search-results';
import {Breadcrumbs} from '@/components/content/breadcrumbs';
import {pageMetadata} from '@/lib/metadata';
export const metadata=pageMetadata('Search calculators','Find the right Finflo calculator for your question.','/search',false);
export default function Page(){return <div className="container directory-page"><Breadcrumbs items={[{label:'Search'}]}/><header className="page-heading"><span className="eyebrow">FIND A CALCULATOR</span><h1>Search calculators</h1></header><Suspense fallback={<p>Loading search…</p>}><SearchResults/></Suspense></div>;}
