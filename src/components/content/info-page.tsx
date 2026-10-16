import {InformationInsight} from './information-insight';
import {GuideIllustration} from './guide-illustration';
import Link from '@/components/i18n/link';
import type {InfoPage as Content} from '@/data/information';
import {PageHero} from './page-hero';

export function InfoPage({page,guide=false,highlight,slug}:{page:Content;guide?:boolean;highlight?:string;slug?:string}){
  return <>
    <PageHero eyebrow={guide?'THE FINFLO GUIDE':'FINFLO · CLEAR BY DESIGN'} title={page.title} description={page.description} highlight={highlight} breadcrumbs={[...(guide?[{label:'Guides',href:'/guides'}]:[]),{label:page.title}]}/>
    <div className="container document-page page-content">
      <article className="document-body">
        {guide&&<p className="editorial-note">Prepared by <Link href="/about">Finflo</Link>. <Link href="/methodology">Our methodology</Link> · <Link href="/editorial-policy">Editorial policy</Link></p>}
        {guide&&slug&&<GuideIllustration slug={slug}/>}
        {!guide&&slug&&<InformationInsight slug={slug}/>}
        {page.sections.map((s,i)=><section key={i}><h2>{s.title}</h2>{s.paragraphs.map((p,j)=><p key={j}>{p}</p>)}{s.links&&<ul>{s.links.map(l=><li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul>}</section>)}
      </article>
    </div>
  </>;
}
