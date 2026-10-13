import Link from './link';
import {CalculatorGuidance} from '@/components/content/calculator-guidance';
import {RelatedGuides} from '@/components/content/related-guides';
import {Accordion, AccordionItem} from '@/components/ui/accordion';
import content from '@/data/calculator-content.json';
import {defaults, type Definition, type Result} from '@/lib/calculators/types';
import {isFieldActive} from '@/lib/calculators/field-visibility';
import {displayField} from '@/lib/calculators/input-display';
import {formatMetric} from '@/lib/calculators/format-metric';
import {languages, translator, type Dictionary, type Locale} from '@/lib/i18n/config';

export function CalculatorArticle({definition, initial, currency, messages, locale}: {
  definition: Definition; initial: Result|null; currency: string; messages: Dictionary; locale: Locale;
}) {
  const t=translator(messages), mode=definition.modes[0], values=defaults(mode);
  const entry=(content as Record<string,{faqs:{question:string;answer:string}[]}>)[definition.slug];
  return <article className="document-body">
    <section id="how-it-works" tabIndex={-1}><h2>{t('How to use this calculator')}</h2>
      <p>{t(definition.description)}</p>
      <p>{t(definition.modes.length>1?'Select the calculation mode that matches your question, then enter the values shown.':'Enter the values in the labeled fields.')} {t('Check the displayed units before calculating. Results reflect the selected model and your inputs.')}</p>
    </section>
    <CalculatorGuidance slug={definition.slug} messages={messages}/>
    <RelatedGuides slug={definition.slug} messages={messages} locale={locale}/>
    {definition.modes.map(mode=><section key={mode.id} id={`method-${mode.id}`}>
      <h2>{t('{mode}: formula and assumptions',{mode:t(mode.title)})}</h2>
      <p className="formula-block" dir="auto">{t(mode.formula)}</p>
      <p>{t(mode.explanation)}</p>{mode.notes?.map(note=><p key={note}>{t(note)}</p>)}
    </section>)}
    {initial&&<section id="example"><h2>{t('Worked example')}</h2>
      {(initial.metrics.some(metric=>metric.format==='money')||mode.fields.some(field=>/\$|£|USD|CAD/.test(field.unit||'')))&&<p>{t('Reference example currency: {currency}. These fixed examples do not change with your calculator preferences.',{currency})}</p>}
      <p>{t('Using the {mode} example:',{mode:t(mode.title)})}</p>
      <dl className="worked-inputs">{mode.fields.filter(field=>isFieldActive(mode,field,values)).map(field=>{
        const displayed=displayField(mode,field,values);
        const options=field.type==='multiselect'?field.options?.filter(option=>field.default.split(',').includes(option.value)):field.options?.filter(option=>option.value===field.default);
        const value=options?.length?options.map(option=>t(option.label)).join(' · '):field.default;
        return <div key={field.key}><dt>{t(displayed.label)}{displayed.unit?` (${t(displayed.unit)})`:''}</dt><dd dir="auto">{value||t('None')}</dd></div>;
      })}</dl>
      <div className="example-answer">{initial.metrics.slice(0,3).map(metric=><p key={metric.label}>{t(metric.label)}: <strong dir="auto">{formatMetric({...metric,unit:metric.unit?t(metric.unit):undefined},currency,languages[locale].tag,t)}</strong></p>)}</div>
      <p>{t('These are illustrative inputs. Change the values to explore a different scenario.')}</p>
    </section>}
    {!!definition.notes?.length&&<section id="limitations"><h2>{t('What to keep in mind')}</h2>{definition.notes.map(note=><p key={note}>{t(note)}</p>)}</section>}
    {!!definition.sources.length&&<section id="sources"><h2>{t('Formula references')}</h2>
      <ul>{definition.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{t(source.title)}<span className="sr-only"> {t('(opens in a new tab)')}</span></a></li>)}</ul>
      <p>{t('References explain the underlying methods; they do not imply endorsement or individual professional review of Finflo.')}</p>
    </section>}
    {!!entry?.faqs.length&&<section id="common-questions"><h2>{t('Common questions')}</h2><Accordion>{entry.faqs.map(faq=><AccordionItem key={faq.question} title={t(faq.question)}><p>{t(faq.answer)}</p></AccordionItem>)}</Accordion></section>}
    <section><h2>{t('About your results')}</h2><Accordion>
      <AccordionItem title={t('Are my inputs saved?')}><p>{t(definition.slug==='mileage-calculator'?'Road mileage sends selected locations to map providers through Finflo, with temporary server caching. The tool-sharing link contains only the page address.':'Inputs stay in this browser only when you choose Save calculation. Manage saved results and backups in My workspace.')} {definition.slug==='mileage-calculator'&&t('Inputs stay in this browser only when you choose Save calculation. Manage saved results and backups in My workspace.')} <Link href="/privacy">{t('Privacy policy')}</Link></p></AccordionItem>
      <AccordionItem title={t('Why might another calculator give a different answer?')}><p>{t('Compare units, compounding or timing assumptions, the selected formula, and rounding. A different model can produce a different estimate even when the headline inputs look similar.')}</p></AccordionItem>
      <AccordionItem title={t('How do I report a result that looks wrong?')}><p><Link href="/contact">{t('Contact Finflo')}</Link>. {t('Use fictional inputs to reproduce the issue. Include the calculation mode, formula, and reference result when possible.')}</p></AccordionItem>
    </Accordion></section>
    <p className="editorial-note">{t('Prepared by Finflo.')} <Link href="/methodology">{t('Our methodology')}</Link> · <Link href="/editorial-policy">{t('Editorial policy')}</Link> · <Link href="/disclaimer">{t('Disclaimer')}</Link></p>
  </article>;
}
