import Link from '@/components/document-link';
import {getToolkitEditorial} from '@/lib/toolkit-editorial';
import {JsonLd} from './json-ld';
import {organizationData} from '@/lib/structured-data';
import {site} from '@/lib/site';
import type {Definition} from '@/lib/calculators/types';

/** Original answers remain present in server HTML before forms hydrate. */
export function ToolkitSummary({slug}: {slug: string}) {
  const entry = getToolkitEditorial(slug);
  if (!entry) return null;
  return <section className="guide-summary" aria-labelledby="quick-answer-heading"><span className="eyebrow">AT A GLANCE</span><h2 id="quick-answer-heading">What this tool helps you work out</h2><p>{entry.quickAnswer}</p><nav aria-label="Tool guide sections"><a className="text-link" href="#calculator-inputs">Use the tool</a><a className="text-link" href="#understanding-1">Read the guide</a><a className="text-link" href="#common-questions">Common questions</a><a className="text-link" href="#sources">Sources</a></nav></section>;
}

export function ToolkitArticleData({definition}: {definition: Definition}) {
  const entry = getToolkitEditorial(definition.slug);
  if (!entry) return null;
  const url = `${site.url}/${definition.slug}`;
  return <><p className="editorial-note">Guide reviewed <time dateTime={entry.reviewedAt}>{new Date(entry.reviewedAt + 'T00:00:00Z').toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})}</time>. Fee presets, when provided, carry their own verification dates. See <Link href="/methodology">how Finflo documents assumptions</Link>.</p><JsonLd data={{'@context':'https://schema.org','@type':'Article','@id':`${url}#guide`,headline:entry.seoTitle,description:entry.description,url,mainEntityOfPage:url,inLanguage:'en',dateModified:entry.reviewedAt,author:organizationData(),publisher:organizationData(),about:{'@id':`${url}#calculator`},citation:definition.sources.map(source=>source.url),hasPart:entry.faqs.map(faq=>({'@type':'Question',name:faq.question,acceptedAnswer:{'@type':'Answer',text:faq.answer}}))}}/></>;
}
