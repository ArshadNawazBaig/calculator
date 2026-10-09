import Link from 'next/link';
import type {InfoPage as Content} from '@/data/information';
import {PageHero} from './page-hero';

export function InfoPage({page,guide=false,highlight}:{page:Content;guide?:boolean;highlight?:string}){
  return <>
    <PageHero eyebrow={guide?'THE FINFLO GUIDE':'FINFLO · CLEAR BY DESIGN'} title={page.title} description={page.description} highlight={highlight} breadcrumbs={[...(guide?[{label:'Guides',href:'/guides'}]:[]),{label:page.title}]}/>
    <div className="container document-page page-content">
      <div className="document-body">{page.sections.map((s,i)=><section key={i}><h2>{s.title}</h2>{s.paragraphs.map((p,j)=><p key={j}>{p}</p>)}{s.links&&<ul>{s.links.map(l=><li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul>}</section>)}</div>
    </div>
  </>;
}
