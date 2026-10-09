'use client';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import data from '@/data/catalog.json';
import type {CatalogEntry} from '@/lib/calculators/types';
const catalog=data as CatalogEntry[];
import {ToolDirectory} from './tool-directory';
import {Search} from '@/components/search';
export function SearchResults(){const query=useSearchParams().get('q')?.trim()||'';const terms=query.toLowerCase().split(/\s+/);const results=query?catalog.filter(t=>terms.every(term=>`${t.title} ${t.category} ${t.subcategory}`.toLowerCase().includes(term))):[];return <><Search key={query} initialQuery={query}/>{query&&<h2 className="mt-8 mb-4 text-xl font-semibold">Results for “{query}”</h2>}{query?<><p className="search-count">{results.length} {results.length===1?'tool':'tools'} found</p>{results.length?<ToolDirectory tools={results} grouped={false}/>:<div className="availability-panel"><h2>No matching calculators</h2><p>Try a shorter phrase such as “mortgage”, “interest”, “date”, or “percentage”.</p><Link href="/calculators" className="text-link">Browse all calculators</Link></div>}</>:<p>Search by name or browse the calculator directory.</p>}</>;}
