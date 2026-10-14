import Link from '@/components/i18n/link';
import {ChevronRight} from 'lucide-react';
import {guides} from '@/data/guides';
import {translator, type Dictionary} from '@/lib/i18n/config';
import {SectionHeading} from './section-heading';
import styles from './home.module.css';

const featuredGuides = [
  {slug: 'understanding-mortgage-payments', topic: 'Finance', number: '01'},
  {slug: 'compound-interest-and-contributions', topic: 'Finance', number: '02'},
  {slug: 'bmi-as-a-screening-tool', topic: 'Health & fitness', number: '03'},
];

export function LearningGuides({messages = {}}: {messages?: Dictionary}) {
  const t = translator(messages);
  return <section className={`container ${styles.section}`} aria-labelledby="guides-title">
    <SectionHeading id="guides-title" eyebrow={t('Guides')} title={t('A little knowledge goes further.')} description={t('Practical guides to the ideas behind the numbers.')} link={{href: '/guides', label: t('Explore all guides')}}/>
    <div className={styles.guideGrid}>{featuredGuides.map(item => <article className={styles.guide} key={item.slug}>
      <div className={styles.guideMeta}><span>{t(item.topic)}</span><span aria-hidden="true">{item.number}</span></div>
      <h3><Link href={`/guides/${item.slug}`}>{t(guides[item.slug].title)}</Link></h3>
      <p>{t(guides[item.slug].description)}</p><Link className={styles.sectionLink} href={`/guides/${item.slug}`} aria-label={`${t('Read the guide')}: ${t(guides[item.slug].title)}`}>{t('Read the guide')}<ChevronRight size={16} aria-hidden="true"/></Link>
    </article>)}</div>
  </section>;
}
