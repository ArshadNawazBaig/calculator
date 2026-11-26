import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {CalculatorGuidance, type GuidanceSection} from '@/components/content/calculator-guidance';
import {DirectoryGuidance, directoryContent} from '@/components/content/directory-guidance';
import {catalog, definitions, definitionMap} from '@/lib/calculators/registry';
import {categorySlug} from '@/lib/catalog-paths';
import {categories} from '@/lib/site';
import content from '@/data/calculator-content.json';
import {getContentDictionary} from '@/lib/i18n/content';
import {locales, localizedPath, publishedPageLocales} from '@/lib/i18n/config';
import {guides, guideCalculators} from '@/data/guides';
import {RelatedGuides} from '@/components/content/related-guides';
import {formatExampleResult} from '@/lib/i18n/example-number';

describe('server-rendered editorial guidance', () => {
  it('localizes grouped amounts and decimal precision without changing input syntax', () => {
    expect(formatExampleResult('1,438.92', 'es')).toBe('1.438,92');
    expect(formatExampleResult('21.60', 'ar')).toBe('٢١٫٦٠');
    expect(formatExampleResult('90,071,992,547,409,931.25', 'en')).toBe('90,071,992,547,409,931.25');
    expect(formatExampleResult('2026-11-26', 'de')).toBe('2026-11-26');
    expect(formatExampleResult('1, 2, 3', 'fr')).toBe('1, 2, 3');
  });

  it('prints the same localized result in each explanation and its worked table', async () => {
    const examples = [
      ['mortgage-calculator', '1,738.92'],
      ['401k-calculator', '29,339.71'],
      ['bmi-calculator', '22.86'],
    ] as const;
    for (const locale of locales) {
      const messages = await getContentDictionary(locale);
      for (const [slug, amount] of examples) {
        const paragraph = content[slug].sections[1].paragraphs[0];
        const printed = formatExampleResult(amount, locale);
        expect(messages[paragraph] ?? paragraph, `${locale}/${slug}`).toContain(printed);
        const html = renderToStaticMarkup(<CalculatorGuidance slug={slug} locale={locale} messages={messages}/>);
        expect(html).toContain(`<bdi dir="ltr">${printed}</bdi>`);
      }
    }
  });

  it('renders distinct interpretation guidance for every available calculator', () => {
    const headings = new Set<string>(), paragraphs = new Set<string>();
    for (const definition of definitions) {
      const entry = content[definition.slug as keyof typeof content];
      const html = renderToStaticMarkup(<CalculatorGuidance slug={definition.slug}/>);
      expect(html, definition.slug).toContain('id="understanding-1"');
      for (const section of entry.sections) {
        expect(headings.has(section.title), section.title).toBe(false);
        headings.add(section.title);
        for (const paragraph of section.paragraphs) {
          expect(paragraphs.has(paragraph), definition.slug).toBe(false);
          paragraphs.add(paragraph);
        }
      }
    }
    expect(renderToStaticMarkup(<CalculatorGuidance slug="not-a-tool"/>)).toBe('');
  });

  it('connects article navigation and worked references to real sections and calculator modes', () => {
    const entries = content as Record<string, {sections: GuidanceSection[]; faqs: {question: string; answer: string}[]}>;
    for (const [slug, entry] of Object.entries(entries)) {
      const html = renderToStaticMarkup(<CalculatorGuidance slug={slug} contents/>);
      expect(html.includes('data-calculator-guide-nav'), slug).toBe(entry.sections.length >= 3);
      for (const [index, section] of entry.sections.entries()) {
        const id = section.id || `understanding-${index + 1}`;
        expect(html).toContain(`id="${id}"`);
        if (entry.sections.length >= 3) expect(html).toContain(`href="#${id}"`);
        if (section.table) {
          for (const row of section.table.rows) expect(row.length, `${slug}: ${section.title}`).toBe(section.table.headers.length);
        }
        if (section.links) for (const link of section.links) {
          const url = new URL(link.href, `https://finflo.org/${slug}`);
          if (url.origin !== 'https://finflo.org') continue;
          const target = definitionMap.get(url.pathname.slice(1));
          expect(Boolean(target) || Object.hasOwn(guides, url.pathname.replace(/^\/guides\//, '')), `${slug}: ${link.href}`).toBe(true);
          // Forms select modes from hashes; a ?mode= query silently opens the default.
          expect(url.searchParams.has('mode'), link.href).toBe(false);
          if (url.hash.startsWith('#mode-')) {
            expect(target?.modes.some(mode => `#mode-${mode.id}` === url.hash), link.href).toBe(true);
          }
        }
      }
      expect(new Set(entry.faqs.map(faq => faq.question)).size, slug).toBe(entry.faqs.length);
    }
  });

  it('preserves every salary guidance bookmark after consolidating repeated explanations', () => {
    const html = renderToStaticMarkup(<CalculatorGuidance slug="salary-calculator" contents/>);
    const sections = [...html.matchAll(/<section id="([^"]+)">([\s\S]*?)<\/section>/g)];
    expect(sections.map(section => section[1])).toEqual(['understanding-1', 'understanding-5', 'understanding-6', 'understanding-7']);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    expect(ids.sort()).toEqual(Array.from({length: 7}, (_, index) => `understanding-${index + 1}`));
    const comparison = sections.find(section => section[1] === 'understanding-6')![2];
    expect(comparison).toContain('id="understanding-2"');
    expect(comparison).toContain('id="understanding-3"');
    expect(comparison).toContain('Example gross-pay conversion: $52,000 per year');
    expect(comparison.match(/scope="row"/g)).toHaveLength(8);
    const leave = sections.find(section => section[1] === 'understanding-7')![2];
    expect(leave).toContain('id="understanding-4"');
    expect(leave).toContain('href="/freelance-rate-calculator"');
    expect(leave).toContain('A real payroll calendar can have a different number of pay dates');
    expect(content['salary-calculator'].faqs).toHaveLength(5);
  });

  it('covers actual directory paths, including punctuation in subcategory names', () => {
    const paths = new Set(['/calculators', ...categories.map(c => `/calculators/${c.id}`), ...catalog.map(tool => `/calculators/${tool.category}/${categorySlug(tool.subcategory)}`)]);
    expect(Object.keys(directoryContent).sort()).toEqual([...paths].sort());
    for (const path of paths) {
      const html = renderToStaticMarkup(<DirectoryGuidance path={path} locale="tl"/>);
      expect(html).toContain('<h2>');
      for (const section of directoryContent[path].sections) for (const link of section.links) {
        expect(html).toContain(`href="${localizedPath(link.href, 'tl')}"`);
        expect(link.href.startsWith('/guides') || link.href === '/methodology' || definitions.some(d => link.href === `/${d.slug}`)).toBe(true);
      }
    }
  });

  it('makes directory guides reachable in every published language', () => {
    const linkedGuides = new Set<string>();
    for (const [path, entry] of Object.entries(directoryContent)) {
      if (!entry.guides?.length) continue;
      const english = renderToStaticMarkup(<DirectoryGuidance path={path}/>);
      expect(new Set(entry.guides).size, path).toBe(entry.guides.length);
      for (const slug of entry.guides) {
        linkedGuides.add(slug);
        expect(guides[slug], path).toBeDefined();
        expect(english, path).toContain(`href="/guides/${slug}"`);
        expect(guideCalculators[slug]?.length, slug).toBeGreaterThan(0);
        for (const calculator of guideCalculators[slug]) {
          const html = renderToStaticMarkup(<RelatedGuides slug={calculator}/>);
          expect(html, calculator).toContain(`href="/guides/${slug}"`);
        }
      }
      for (const locale of locales.filter(locale => locale !== 'en')) {
        const translated = renderToStaticMarkup(<DirectoryGuidance path={path} locale={locale}/>);
        expect(translated, `${locale}${path}`).toContain('data-directory-guides');
        for (const slug of entry.guides) expect(translated, `${locale}${path}`).toContain(`href="${localizedPath(`/guides/${slug}`, locale)}"`);
      }
    }
    expect([...linkedGuides].sort()).toEqual([
      'compare-loan-offers-apr-fees',
      'elapsed-time-breaks-and-decimal-hours',
      'hourly-vs-salary-pay-comparison',
      'sharing-and-scaling-ratios',
    ]);
  });

  it('renders published calculator guidance and existing directory translations without English fallback', async () => {
    const entry = content['mortgage-calculator'].sections[0];
    const dictionaries = await Promise.all(locales.filter(locale => locale !== 'en').map(async locale => ({locale, messages: await getContentDictionary(locale)})));
    for (const {locale, messages} of dictionaries) {
      // New English guidance is reviewed before any draft language is published.
      if (publishedPageLocales('/mortgage-calculator').includes(locale)) {
        const html = renderToStaticMarkup(<CalculatorGuidance slug="mortgage-calculator" messages={messages}/>);
        expect(messages[entry.title], locale).toBeTruthy();
        expect(messages[entry.paragraphs[0]], locale).toBeTruthy();
        expect(html, locale).not.toContain(entry.title);
        expect(html, locale).not.toContain(entry.paragraphs[0]);
      }
      const directory = renderToStaticMarkup(<DirectoryGuidance path="/calculators/finance" locale={locale} messages={messages}/>);
      expect(directory).not.toContain(directoryContent['/calculators/finance'].sections[0].title);
    }
  }, 20_000);
});
