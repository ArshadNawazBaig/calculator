import {CalculatorInsight} from '@/components/content/calculator-insight';
import {MethodNavigation} from '@/components/content/method-navigation';
import Link from './link';
import {CalculatorGuidance} from '@/components/content/calculator-guidance';
import {RelatedGuides} from '@/components/content/related-guides';
import {Accordion, AccordionItem} from '@/components/ui/accordion';
import content from '@/data/calculator-content.json';
import {type Definition, type Result} from '@/lib/calculators/types';
import {WorkedExample} from '@/components/content/worked-example';
import {translator, type Dictionary, type Locale} from '@/lib/i18n/config';

export function CalculatorArticle({definition, initial, currency, messages, locale}: {
  definition: Definition; initial: Result|null; currency: string; messages: Dictionary; locale: Locale;
}) {
  const t=translator(messages);
  const entry=(content as Record<string,{faqs:{question:string;answer:string}[]}>)[definition.slug];
  return <article className="document-body">
    <section id="how-it-works" tabIndex={-1}><h2>{t('How it works')}</h2><MethodNavigation modes={definition.modes} messages={messages} locale={locale}/></section>
    <CalculatorInsight slug={definition.slug} locale={locale}/>
    <CalculatorGuidance slug={definition.slug} messages={messages}/>
    <RelatedGuides slug={definition.slug} messages={messages} locale={locale}/>
    {definition.modes.map(mode=><section key={mode.id} id={`method-${mode.id}`}>
      <h2>{t('{mode}: formula and assumptions',{mode:t(mode.title)})}</h2>
      <p className="formula-block" dir="auto">{t(mode.formula)}</p>
      <p>{t(mode.explanation)}</p>{mode.notes?.map(note=><p key={note}>{t(note)}</p>)}
    </section>)}
    {initial&&<WorkedExample mode={definition.modes[0]} result={initial} currency={currency} messages={messages} locale={locale}/>}
    {!!definition.notes?.length&&<section id="limitations"><h2>{t('What to keep in mind')}</h2>{definition.notes.map(note=><p key={note}>{t(note)}</p>)}</section>}
    {!!definition.sources.length&&<section id="sources"><h2>{t('Formula references')}</h2>
      <ul>{definition.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{t(source.title)}<span className="sr-only"> {t('(opens in a new tab)')}</span></a></li>)}</ul>
      <p>{t('References explain the underlying methods; they do not imply endorsement or individual professional review of Finflo.')}</p>
    </section>}
    {!!entry?.faqs.length&&<section id="common-questions"><h2>{t('Common questions')}</h2><Accordion>{entry.faqs.map(faq=><AccordionItem key={faq.question} title={t(faq.question)}><p>{t(faq.answer)}</p></AccordionItem>)}</Accordion></section>}
    <p className="editorial-note">{t('Prepared by Finflo.')} <Link href="/methodology">{t('Our methodology')}</Link> · <Link href="/editorial-policy">{t('Editorial policy')}</Link> · <Link href="/disclaimer">{t('Disclaimer')}</Link></p>
  </article>;
}
