import {InformationInsight} from './information-insight';
import {GuideIllustration} from './guide-illustration';
import Link from '@/components/i18n/link';
import type {InfoPage as Content} from '@/data/information';
import {PageHero} from './page-hero';
import styles from './explanation.module.css';

export function InfoPage({page,guide=false,highlight,slug}:{page:Content;guide?:boolean;highlight?:string;slug?:string}){
  return <>
    <PageHero eyebrow={guide?'THE FINFLO GUIDE':'FINFLO · CLEAR BY DESIGN'} title={page.title} description={page.description} highlight={highlight} breadcrumbs={[...(guide?[{label:'Guides',href:'/guides'}]:[]),{label:page.title}]}/>
    <div className="container document-page page-content">
      <article className="document-body">
        {guide&&<p className="editorial-note">Prepared by <Link href="/about">Finflo</Link>. <Link href="/methodology">Our methodology</Link> · <Link href="/editorial-policy">Editorial policy</Link></p>}
        {guide&&slug&&<GuideIllustration slug={slug}/>}
        {!guide&&slug&&<InformationInsight slug={slug}/>}
        {guide&&<nav aria-label="In this guide" className={styles.panel}><strong>In this guide</strong><ul>{page.sections.map((section,index)=><li key={section.title}><a href={`#guide-section-${index+1}`}>{section.title}</a></li>)}</ul></nav>}
        {page.sections.map((s,i)=><section key={i} id={guide?`guide-section-${i+1}`:undefined}>
          <h2>{s.title}</h2>{s.paragraphs.map((p,j)=><p key={j}>{p}</p>)}
          {s.table&&<div className={styles.scroll} role="region" aria-label={s.table.caption} tabIndex={0}>
            <table className={styles.table}>
              <caption>{s.table.caption}</caption>
              <thead><tr>{s.table.headers.map(header=><th key={header} scope="col">{header}</th>)}</tr></thead>
              <tbody>{s.table.rows.map((row,rowIndex)=><tr key={rowIndex}>{row.map((cell,columnIndex)=>columnIndex===0?<th key={columnIndex} scope="row">{cell}</th>:<td key={columnIndex}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>}
          {s.links&&<ul>{s.links.map(l=><li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul>}
        </section>)}
      </article>
    </div>
  </>;
}
