import {PageHero} from '@/components/content/page-hero';
import {connection} from 'next/server';
import {SearchResults} from '@/components/content/search-results';
import {pageMetadata} from '@/lib/metadata';
export const metadata=pageMetadata('Search calculators','Find the right Finflo calculator for your question.','/search',false);
export default async function Page(){
  // Render the requested query in HTML so native GET search works before hydration.
  await connection();
  return <><PageHero eyebrow="FIND YOUR NEXT TOOL" title="Search calculators" description="Find the calculation you need for money, health, math, and everyday life." breadcrumbs={[{label:'Search'}]}/><div className="container directory-page page-content"><SearchResults/></div></>;
}
