import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {CalculatorGuidance} from '@/components/content/calculator-guidance';
import {DirectoryGuidance, directoryContent} from '@/components/content/directory-guidance';
import {catalog, definitions} from '@/lib/calculators/registry';
import {categorySlug} from '@/lib/catalog-paths';
import {categories} from '@/lib/site';
import content from '@/data/calculator-content.json';
import {getContentDictionary} from '@/lib/i18n/content';
import {locales, localizedPath} from '@/lib/i18n/config';

describe('server-rendered editorial guidance', () => {
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

  it('renders the new article text in each selected language without English fallback', async () => {
    const entry = content['mortgage-calculator'].sections[0];
    const dictionaries = await Promise.all(locales.filter(locale => locale !== 'en').map(async locale => ({locale, messages: await getContentDictionary(locale)})));
    for (const {locale, messages} of dictionaries) {
      const html = renderToStaticMarkup(<CalculatorGuidance slug="mortgage-calculator" messages={messages}/>);
      expect(messages[entry.title], locale).toBeTruthy();
      expect(messages[entry.paragraphs[0]], locale).toBeTruthy();
      expect(html, locale).not.toContain(entry.title);
      expect(html, locale).not.toContain(entry.paragraphs[0]);
      const directory = renderToStaticMarkup(<DirectoryGuidance path="/calculators/finance" locale={locale} messages={messages}/>);
      expect(directory).not.toContain(directoryContent['/calculators/finance'].sections[0].title);
    }
  });
});
