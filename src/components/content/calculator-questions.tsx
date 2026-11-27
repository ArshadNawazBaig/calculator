import content from '@/data/calculator-content.json';
import {mathSearchContent} from '@/data/math-search-content';
import {Accordion, AccordionItem} from '@/components/ui/accordion';
import {localizedPath, translator, type Dictionary, type Locale} from '@/lib/i18n/config';
import {site} from '@/lib/site';
import {JsonLd} from './json-ld';

type Entry = {faqs: {question: string; answer: string}[]};

export function CalculatorQuestions({slug, messages = {}, locale = 'en'}: {slug: string; messages?: Dictionary; locale?: Locale}) {
  const entry = (content as Record<string, Entry>)[slug];
  if (!entry?.faqs.length) return null;
  const t = translator(messages);
  const questions = entry.faqs.map(({question, answer}) => ({question: t(question), answer: t(answer)}));
  const url = site.url + localizedPath('/' + slug, locale);

  return <section id="common-questions">
    <h2>{t('Common questions')}</h2>
    <Accordion>{questions.map(({question, answer}) => <AccordionItem key={question} title={question}><p>{answer}</p></AccordionItem>)}</Accordion>
    {mathSearchContent[slug]?.publishedAt && <JsonLd data={{
      '@context': 'https://schema.org', '@type': 'FAQPage', '@id': url + '#common-questions', url, inLanguage: locale,
      mainEntity: questions.map(({question, answer}) => ({
        '@type': 'Question', name: question, acceptedAnswer: {'@type': 'Answer', text: answer},
      })),
    }}/>}
  </section>;
}
