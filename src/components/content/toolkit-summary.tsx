import {languages, localizedPath, translator, type Dictionary, type Locale} from '@/lib/i18n/config';
import Link from '@/components/document-link';
import {getToolkitEditorial} from '@/lib/toolkit-editorial';
import {JsonLd} from './json-ld';
import {organizationData} from '@/lib/structured-data';
import {site} from '@/lib/site';
import type {Definition} from '@/lib/calculators/types';

/** Original answers remain present in server HTML before forms hydrate. */
export function ToolkitSummary({slug, messages = {}}: {slug: string; messages?: Dictionary}) {
  const t = translator(messages);
  const entry = getToolkitEditorial(slug);
  if (!entry) return null;
  return <section className="guide-summary" aria-labelledby="quick-answer-heading"><span className="eyebrow">{t('AT A GLANCE')}</span><h2 id="quick-answer-heading">{t('What this tool helps you work out')}</h2><p>{t(entry.quickAnswer)}</p><nav aria-label={t('Tool guide sections')}><a className="text-link" href="#calculator-inputs">{t('Use the tool')}</a><a className="text-link" href="#understanding-1">{t('Read the guide')}</a><a className="text-link" href="#common-questions">{t('Common questions')}</a><a className="text-link" href="#sources">{t('Sources')}</a></nav></section>;
}

export function ToolkitArticleData({definition, messages = {}, locale = 'en'}: {definition: Definition; messages?: Dictionary; locale?: Locale}) {
  const t = translator(messages);
  const entry = getToolkitEditorial(definition.slug);
  if (!entry) return null;
  const url = site.url + localizedPath(`/${definition.slug}`, locale);
  return <><p className="editorial-note">{t('Guide reviewed')} <time dateTime={entry.reviewedAt}>{new Date(entry.reviewedAt + 'T00:00:00Z').toLocaleDateString(languages[locale].tag, {year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})}</time>. {t('Fee presets, when provided, carry their own verification dates.')} <Link href={localizedPath('/methodology', locale)}>{t('how Finflo documents assumptions')}</Link>.</p><JsonLd data={{'@context':'https://schema.org','@type':'Article','@id':`${url}#guide`,headline:t(entry.seoTitle),description:t(entry.description),url,mainEntityOfPage:url,inLanguage:locale,dateModified:entry.reviewedAt,author:organizationData(),publisher:organizationData(),about:{'@id':`${url}#calculator`},citation:definition.sources.map(source=>source.url),hasPart:entry.faqs.map(faq=>({'@type':'Question',name:t(faq.question),acceptedAnswer:{'@type':'Answer',text:t(faq.answer)}}))}}/></>;
}
