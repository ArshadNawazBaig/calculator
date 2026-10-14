import Link from '@/components/i18n/link';
import {TranslationMessages} from '@/components/i18n/provider';
import {CalculatorCard} from '@/components/calculators/calculator-card';
import {timeListings} from '@/lib/tool-listings';
import {cardMessages} from '@/lib/i18n/dictionaries';
import {translator, type Dictionary} from '@/lib/i18n/config';
import home from '@/components/home/home.module.css';
export function TimeCollection({messages = {}, homepage = false}: {messages?: Dictionary; homepage?: boolean}) {
  const t = translator(messages);
  return <section id="time" className={homepage ? `container ${home.section}` : 'category-directory'} aria-labelledby="time-collection-title">
    <div className={home.sectionHeading}><div><span className={home.eyebrow}>{t('Time & clocks')}</span><h2 id="time-collection-title">{t('Make time work for you.')}</h2><p>{t('Plan a call, check a date, or focus on what comes next.')}</p></div><Link className={home.sectionLink} href="/time">{t('Explore time tools')}<span aria-hidden="true">↗</span></Link></div>
    <TranslationMessages messages={cardMessages(messages, timeListings)}><div className="directory-grid">{timeListings.map(tool => <CalculatorCard key={tool.slug} tool={{...tool, description: tool.description || ''}}/>)}</div></TranslationMessages>
  </section>;
}
