import Link from '@/components/i18n/link';
import {ChevronRight} from 'lucide-react';
import {CalculatorCard} from '@/components/calculators/calculator-card';
import {calculatorCardData} from '@/lib/calculator-cards';
import {wheelListings} from '@/lib/tool-listings';
import {translator, type Dictionary} from '@/lib/i18n/config';
import {TranslationMessages} from '@/components/i18n/provider';
import {cardMessages} from '@/lib/i18n/dictionaries';
import {HomeSectionImage} from '@/components/home/home-section-image';
import {SectionHeading} from '@/components/home/section-heading';
import home from '@/components/home/home.module.css';
import feature from '@/components/home/collection-feature.module.css';

export function WheelCollection({messages = {}, homepage = false}: {messages?: Dictionary; homepage?: boolean}) {
  const t = translator(messages);
  const tools = homepage ? wheelListings.filter(tool => ['wheel-of-names', 'yes-or-no-wheel', 'number-picker-wheel', 'what-to-eat-wheel'].includes(tool.slug)) : wheelListings;
  if (homepage) return <section id="spin-wheels" className={`container ${home.section}`} aria-labelledby="wheel-collection-title">
    <SectionHeading id="wheel-collection-title" eyebrow={t('Spin wheels')} title={t('Leave a little to chance.')} description={t('Pick a name, settle a choice, or find your next idea with a spin.')} link={{href: '/spin-wheels', label: t('Explore spin wheels')}}/>
    <div className={feature.panel}>
      <div className={feature.media}><HomeSectionImage image="spin-wheels" messages={messages} className={feature.art} sizes="(max-width: 960px) calc(100vw - 36px), (max-width: 1344px) 44vw, 550px"/></div>
      <div className={feature.content}>
        <div className={feature.tools}>{tools.map(tool => {
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
  const heading = <div className={home.sectionHeading}>
      <div><span className={home.eyebrow}>{t('Spin wheels')}</span><h2 id="wheel-collection-title">{t('Leave a little to chance.')}</h2><p>{t('Pick a name, settle a choice, or find your next idea with a spin.')}</p></div>
      <Link className={home.sectionLink} href="/spin-wheels">{t('Explore spin wheels')}<ChevronRight size={16} aria-hidden="true"/></Link>
    </div>;
  return <section id="spin-wheels" className="category-directory" aria-labelledby="wheel-collection-title">
    {heading}
    <TranslationMessages messages={cardMessages(messages, tools)}><div className="directory-grid">{tools.map(tool => <CalculatorCard key={tool.slug} tool={calculatorCardData(tool)} appearance="directory"/>)}</div></TranslationMessages>
  </section>;
}
