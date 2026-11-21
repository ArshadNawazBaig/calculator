import Link from '@/components/i18n/link';
import {ChevronRight} from 'lucide-react';
import {TranslationMessages} from '@/components/i18n/provider';
import {CalculatorCard} from '@/components/calculators/calculator-card';
import {timeListings} from '@/lib/tool-listings';
import {cardMessages} from '@/lib/i18n/dictionaries';
import {translator, type Dictionary} from '@/lib/i18n/config';
import {HomeSectionImage} from '@/components/home/home-section-image';
import {SectionHeading} from '@/components/home/section-heading';
import home from '@/components/home/home.module.css';
import feature from '@/components/home/collection-feature.module.css';
export function TimeCollection({messages = {}, homepage = false}: {messages?: Dictionary; homepage?: boolean}) {
  const t = translator(messages);
  if (homepage) return <section id="time" className={`container ${home.section}`} aria-labelledby="time-collection-title">
    <SectionHeading id="time-collection-title" eyebrow={t('Time & clocks')} title={t('Make time work for you.')} description={t('Plan a call, check a date, or focus on what comes next.')} link={{href: '/time', label: t('Explore time tools')}}/>
    <div className={feature.panel}>
      <div className={feature.media}><HomeSectionImage image="time" messages={messages} className={feature.art} sizes="(max-width: 960px) calc(100vw - 36px), (max-width: 1344px) 44vw, 550px"/></div>
      <div className={feature.content}>
        <div className={feature.tools}>{timeListings.map(tool => {
          const title = messages[`tool.${tool.slug}`] || tool.title;
          return <article className={feature.tool} data-calculator-card={tool.slug} data-category={tool.category} data-status="available" key={tool.slug}>
            <Link className={feature.toolLink} href={tool.href || `/${tool.slug}`} aria-label={title}>
              <div><h3>{title}</h3><p>{messages[`description.${tool.slug}`] || tool.description}</p></div><ChevronRight size={18} aria-hidden="true"/>
            </Link>
          </article>;
        })}</div>
      </div>
    </div>
  </section>;
  const heading = <div className={home.sectionHeading}><div><span className={home.eyebrow}>{t('Time & clocks')}</span><h2 id="time-collection-title">{t('Make time work for you.')}</h2><p>{t('Plan a call, check a date, or focus on what comes next.')}</p></div><Link className={home.sectionLink} href="/time">{t('Explore time tools')}<ChevronRight size={16} aria-hidden="true"/></Link></div>;
  return <section id="time" className="category-directory" aria-labelledby="time-collection-title">
    {heading}
    <TranslationMessages messages={cardMessages(messages, timeListings)}><div className="directory-grid">{timeListings.map(tool => <CalculatorCard key={tool.slug} tool={{...tool, description: tool.description || ''}} appearance="directory"/>)}</div></TranslationMessages>
  </section>;
}
