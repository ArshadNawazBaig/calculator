import Link from '@/components/i18n/link';
import {ChevronRight} from 'lucide-react';
import {CalculatorCard} from '@/components/calculators/calculator-card';
import {calculatorCardData} from '@/lib/calculator-cards';
import {wheelListings} from '@/lib/tool-listings';
import {translator, type Dictionary} from '@/lib/i18n/config';
import {TranslationMessages} from '@/components/i18n/provider';
import {cardMessages} from '@/lib/i18n/dictionaries';
import home from '@/components/home/home.module.css';

export function WheelCollection({messages = {}, homepage = false}: {messages?: Dictionary; homepage?: boolean}) {
  const t = translator(messages);
  const tools = homepage ? wheelListings.filter(tool => ['wheel-of-names', 'yes-or-no-wheel', 'number-picker-wheel', 'what-to-eat-wheel'].includes(tool.slug)) : wheelListings;
  return <section id="spin-wheels" className={homepage ? `container ${home.section}` : 'category-directory'} aria-labelledby="wheel-collection-title">
    <div className={home.sectionHeading}>
      <div><span className={home.eyebrow}>{t('Spin wheels')}</span><h2 id="wheel-collection-title">{t('Leave a little to chance.')}</h2><p>{t('Pick a name, settle a choice, or find your next idea with a spin.')}</p></div>
      <Link className={home.sectionLink} href="/spin-wheels">{t('Explore spin wheels')}<ChevronRight size={16} aria-hidden="true"/></Link>
    </div>
    <TranslationMessages messages={cardMessages(messages, tools)}><div className="directory-grid">{tools.map(tool => <CalculatorCard key={tool.slug} tool={calculatorCardData(tool)}/>)}</div></TranslationMessages>
  </section>;
}
