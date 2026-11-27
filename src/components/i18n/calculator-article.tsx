import {MathSearchAnswer, MathSearchContent} from '@/components/content/math-search-content';
import {mathSearchContent} from '@/data/math-search-content';
import {ToolkitSummary, ToolkitArticleData} from '@/components/content/toolkit-summary';
import {CalculatorExample} from '@/components/content/calculator-example';
import {CalculatorInsight} from '@/components/content/calculator-insight';
import {PregnancyVisual} from '@/components/content/pregnancy-visual';
import {CalculatorVisual} from '@/components/content/calculator-visual';
import {AdultBmiScreening} from '@/components/content/adult-bmi-screening';
import {MethodNavigation} from '@/components/content/method-navigation';
import Link from './link';
import {CalculatorGuidance} from '@/components/content/calculator-guidance';
import {RelatedGuides} from '@/components/content/related-guides';
import {CalculatorQuestions} from '@/components/content/calculator-questions';
import catalog from '@/data/catalog.json';
import {type Definition, type Result} from '@/lib/calculators/types';
import {WorkedExample} from '@/components/content/worked-example';
import {translator, type Dictionary, type Locale} from '@/lib/i18n/config';

export function CalculatorArticle({definition, initial, currency, messages, locale, title}: {
  definition: Definition; initial: Result|null; currency: string; messages: Dictionary; locale: Locale; title?: string;
}) {
  const t=translator(messages);
  const visualTitle=title||messages['tool.'+definition.slug]||catalog.find(tool=>tool.slug===definition.slug)?.title||definition.slug;
  const reference = mathSearchContent[definition.slug];
  const illustratedReference = Boolean(reference) && ['area-calculator','volume-calculator','surface-area-calculator'].includes(definition.slug);
  const referenceModes = new Set(illustratedReference ? reference!.rows.map(row => row.id) : []);
  return <article className="document-body">
    <MathSearchAnswer slug={definition.slug} messages={messages}/>
    <ToolkitSummary slug={definition.slug} messages={messages}/>
    <section id="how-it-works" tabIndex={-1}><h2>{t('How it works')}</h2><MethodNavigation modes={definition.modes} messages={messages} locale={locale}/></section>
    {definition.slug==='pregnancy-calculator'?<PregnancyVisual locale={locale}/>:<CalculatorVisual slug={definition.slug} title={visualTitle} modes={definition.modes} locale={locale} messages={messages}/>}
    {definition.slug!=='volume-calculator'&&<CalculatorInsight slug={definition.slug} locale={locale}>
      <CalculatorExample slug={definition.slug} locale={locale} messages={messages} nested/>
    </CalculatorInsight>}
    {definition.slug==='overweight-calculator'&&<AdultBmiScreening messages={messages} locale={locale}/>}
    {!illustratedReference&&<CalculatorGuidance slug={definition.slug} messages={messages} locale={locale} contents/>}
    <MathSearchContent slug={definition.slug} messages={messages} locale={locale}/>
    <RelatedGuides slug={definition.slug} messages={messages} locale={locale}/>
    {definition.modes.filter(mode=>!referenceModes.has(mode.id)).map(mode=><section key={mode.id} id={`method-${mode.id}`}>
      <h2>{t('{mode}: formula and assumptions',{mode:t(mode.title)})}</h2>
      <p className="formula-block" dir="auto">{t(mode.formula)}</p>
      <p>{t(mode.explanation)}</p>{mode.notes?.map(note=><p key={note}>{t(note)}</p>)}
      <p><a className="text-link" href={`#mode-${mode.id}`}>{t('Use the calculator')}: {t(mode.title)}</a></p>
    </section>)}
    {initial&&!illustratedReference&&<WorkedExample mode={definition.modes[0]} result={initial} currency={currency} messages={messages} locale={locale}/>}
    {!!definition.notes?.length&&<section id="limitations"><h2>{t('What to keep in mind')}</h2>{definition.notes.map(note=><p key={note}>{t(note)}</p>)}</section>}
    {!!definition.sources.length&&<section id="sources"><h2>{t('Formula references')}</h2>
      <ul>{definition.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{t(source.title)}<span className="sr-only"> {t('(opens in a new tab)')}</span></a></li>)}</ul>
      <p>{t('References explain the underlying methods; they do not imply endorsement or individual professional review of Finflo.')}</p>
    </section>}
    <CalculatorQuestions slug={definition.slug} messages={messages} locale={locale}/>
    <ToolkitArticleData definition={definition} messages={messages} locale={locale}/>
    <p className="editorial-note">{!reference?.publishedAt && t('Prepared by Finflo.')} <Link href="/methodology">{t('Our methodology')}</Link> · <Link href="/editorial-policy">{t('Editorial policy')}</Link> · <Link href="/disclaimer">{t('Disclaimer')}</Link></p>
  </article>;
}
