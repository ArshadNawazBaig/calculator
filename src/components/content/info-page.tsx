import {translator, type Dictionary, type Locale} from '@/lib/i18n/config';
import {InformationInsight} from './information-insight';
import {GuideIllustration} from './guide-illustration';
import Link from '@/components/i18n/link';
import type {InfoPage as Content} from '@/data/information';
import {PageHero} from './page-hero';
import styles from './explanation.module.css';

export function InfoPage({page,guide=false,highlight,slug,tools=[],messages={},locale='en'}:{page:Content;guide?:boolean;highlight?:string;slug?:string;tools?:{label:string;href:string}[];messages?:Dictionary;locale?:Locale}){
  const t=translator(messages);
  return <>
    <PageHero eyebrow={guide?t('THE FINFLO GUIDE'):t('FINFLO · CLEAR BY DESIGN')} title={t(page.title)} description={t(page.description)} highlight={highlight} breadcrumbs={[...(guide?[{label:t('Guides'),href:'/guides'}]:[]),{label:t(page.title)}]}/>
    <div className="container document-page page-content">
      <article className="document-body">
        {guide&&<p className="editorial-note"><Link href="/about">{t('Prepared by Finflo.')}</Link> <Link href="/methodology">{t('Our methodology')}</Link> · <Link href="/editorial-policy">{t('Editorial policy')}</Link></p>}
        {guide&&tools.length>0&&<nav className={styles.methodLinks} aria-label={t('Calculators for this guide')}>{tools.map(tool=><Link key={tool.href} href={tool.href}>{t(tool.label)}</Link>)}</nav>}
        {guide&&slug&&<GuideIllustration slug={slug} locale={locale} messages={messages}/>}
        {!guide&&slug&&<InformationInsight slug={slug} locale={locale}/>}
        {guide&&<nav aria-label={t('In this guide')} className={styles.panel}><strong>{t('In this guide')}</strong><ul>{page.sections.map((section,index)=><li key={section.title}><a href={`#guide-section-${index+1}`}>{t(section.title)}</a></li>)}</ul></nav>}
        {page.sections.map((s,i)=><section key={i} id={guide?`guide-section-${i+1}`:undefined}>
          <h2>{t(s.title)}</h2>{s.paragraphs.map((p,j)=><p key={j}>{t(p)}</p>)}
          {s.table&&<div className={styles.scroll} role="region" aria-label={t(s.table.caption)} tabIndex={0}>
            <table className={styles.table}>
              <caption>{t(s.table.caption)}</caption>
              <thead><tr>{s.table.headers.map(header=><th key={header} scope="col">{t(header)}</th>)}</tr></thead>
              <tbody>{s.table.rows.map((row,rowIndex)=><tr key={rowIndex}>{row.map((cell,columnIndex)=>columnIndex===0?<th key={columnIndex} scope="row">{t(cell)}</th>:<td key={columnIndex}>{t(cell)}</td>)}</tr>)}</tbody>
            </table>
          </div>}
          {s.links&&<ul>{s.links.map(l=><li key={l.href}><Link href={l.href}>{t(l.label)}</Link></li>)}</ul>}
        </section>)}
      </article>
    </div>
  </>;
}
