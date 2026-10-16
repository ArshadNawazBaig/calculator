import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {getFaqContent} from '@/lib/faq';
import {locales, localizedPath, isTranslatedPage} from '@/lib/i18n/config';
import {FaqPage} from '@/components/content/faq-page';
import {localizedMetadata, localizedStaticParams} from '@/lib/i18n/pages';
import {generateMetadata} from '@/app/(en)/faq/page';
import {languageAlternates} from '@/lib/metadata';
import {site} from '@/lib/site';
import translatedPages from '@/data/locales/translated-pages.json';
import sitemap from '@/app/sitemap';

describe('FAQ publishing', () => {
  it.each(locales)('%s has complete distinct answers and working internal destinations', async locale => {
    const [source, copy] = await Promise.all([getFaqContent('en'), getFaqContent(locale)]);
    expect(copy.groups.map(group => group.id)).toEqual(source.groups.map(group => group.id));
    for (const field of ['title', 'seoTitle', 'description', 'eyebrow', 'topicsLabel', 'contactTitle', 'contactText', 'contactLinkLabel'] as const) expect(copy[field].trim()).toBeTruthy();
    const questions = copy.groups.flatMap(group => group.questions);
    const originals = source.groups.flatMap(group => group.questions);
    expect(questions.length).toBeGreaterThanOrEqual(24);
    expect(questions.map(item => item.id)).toEqual(originals.map(item => item.id));
    for (const field of ['id', 'question', 'answer'] as const) expect(new Set(questions.map(item => item[field])).size).toBe(questions.length);
    const destinations = new Set([...translatedPages, '/workspace', '/search']);
    questions.forEach((item, index) => {
      expect(item.question.trim()).toBeTruthy();
      expect(item.answer.trim()).toBeTruthy();
      expect(item.link?.href).toBe(originals[index].link?.href);
      if (item.link) expect(destinations.has(item.link.href.split(/[?#]/)[0]), item.link.href).toBe(true);
      if (locale !== 'en') {
        expect(item.question).not.toBe(originals[index].question);
        expect(item.answer).not.toBe(originals[index].answer);
      }
    });
  });

  it.each(locales)('%s publishes the same answers in HTML and structured data', async locale => {
    const copy = await getFaqContent(locale);
    const html = renderToStaticMarkup(await FaqPage({locale}));
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    const schema = schemas.find(data => data['@type'] === 'FAQPage');
    const questions = copy.groups.flatMap(group => group.questions);
    expect(schema.url).toBe(site.url + localizedPath('/faq', locale));
    expect(schema.inLanguage).toBe(locale);
    expect(schema.mainEntity.map((item: {name: string; acceptedAnswer: {text: string}}) => [item.name, item.acceptedAnswer.text])).toEqual(questions.map(item => [item.question, item.answer]));
    expect((html.match(/<details\b/g) || []).length).toBe(questions.length);
    for (const item of questions) expect(html).toContain(renderToStaticMarkup(<p>{item.answer}</p>));
    expect(html).not.toMatch(/undefined|<unk>|⁇/);
  });

  it('includes every FAQ language in routing and canonical alternates', async () => {
    expect(translatedPages.filter(path => path === '/faq')).toHaveLength(1);
    expect(isTranslatedPage('/faq')).toBe(true);
    expect(localizedStaticParams()).toContainEqual({path: ['faq']});
    expect(Object.keys(languageAlternates('/faq') || {})).toHaveLength(locales.length + 1);
    for (const locale of locales) {
      const metadata = locale === 'en' ? await generateMetadata() : await localizedMetadata(locale)({params: Promise.resolve({path: ['faq']})});
      const copy = await getFaqContent(locale);
      expect(metadata.title).toEqual({absolute: copy.seoTitle.replace(/\s*\|\s*Finflo\s*$/i, '')});
      expect(metadata.description).toBe(copy.description);
      expect(metadata.alternates?.canonical).toBe(localizedPath('/faq', locale));
    }
  });

  it('includes all FAQ variants when production indexing is enabled', () => {
    const original = site.indexable;
    try {
      site.indexable = true;
      const entries = sitemap();
      for (const locale of locales) {
        const entry = entries.find(item => item.url === site.url + localizedPath('/faq', locale));
        expect(entry).toBeDefined();
        expect(entry?.alternates?.languages).toEqual(languageAlternates('/faq'));
      }
    } finally {site.indexable = original;}
  });
});
