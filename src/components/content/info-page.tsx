import Link from 'next/link';
import type {InfoPage as Content} from '@/data/information';
import {Breadcrumbs} from './breadcrumbs';
export function InfoPage({page}:{page:Content}){return <div className="container document-page"><Breadcrumbs items={[{label:page.title}]}/><header className="page-heading"><span className="eyebrow">FINFLO · CLEAR BY DESIGN</span><h1>{page.title}</h1><p>{page.description}</p></header><div className="document-body">{page.sections.map((s,i)=><section key={i}><h2>{s.title}</h2>{s.paragraphs.map((p,j)=><p key={j}>{p}</p>)}{s.links&&<ul>{s.links.map(l=><li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul>}</section>)}</div></div>;}
