import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {catalog, definitionMap, relatedTools, toolMap} from '@/lib/calculators/registry';
import {calculatorFamilies, relatedCalculatorSlugs} from '@/data/calculator-relationships';
import {guides, guideCalculators} from '@/data/guides';
import {RelatedGuides} from '@/components/content/related-guides';
import {getDictionary, sharedMessages, cardMessages} from '@/lib/i18n/dictionaries';
import {getContentDictionary} from '@/lib/i18n/content';
import {locales, translator} from '@/lib/i18n/config';
import {searchCalculators} from '@/lib/calculator-search';
import {breadcrumbData, guideData} from '@/lib/structured-data';
import {pageMetadata} from '@/lib/metadata';
import {calculate} from '@/lib/calculators/engine';
import {defaults} from '@/lib/calculators/types';

describe('calculator discovery and translated payloads', () => {
  it('keeps every related link functional, distinct, and relevant to the main tasks', () => {
    for (const slug of [...calculatorFamilies.flat(), ...Object.keys(relatedCalculatorSlugs), ...Object.values(relatedCalculatorSlugs).flat()]) expect(toolMap.has(slug), slug).toBe(true);
    for (const tool of catalog) {
      const related = relatedTools(tool);
      expect(related).toHaveLength(6);
      expect(new Set(related.map(item=>item.slug)).size).toBe(6);
      for (const item of related) {
        expect(item.slug).not.toBe(tool.slug);
        expect(definitionMap.has(item.slug)).toBe(true);
      }
    }
    const bmi = relatedTools(toolMap.get('bmi-calculator')!).map(tool=>tool.slug);
    expect(bmi).toContain('healthy-weight-calculator');
    expect(bmi).not.toContain('anorexic-bmi-calculator');
    const percent = relatedTools(toolMap.get('percent-calculator')!).map(tool=>tool.slug);
    expect(percent).toContain('discount-calculator');
    expect(percent).toContain('fraction-calculator');
  });

  it('opens compound interest with growth inputs and preserves the rate converter', async () => {
    const definition = definitionMap.get('compound-interest-calculator')!;
    const mode = definition.modes[0];
    expect(mode.id).toBe('growth');
    const result = await calculate('finance', mode, {...defaults(mode),initial:'10000',contribution:'0',rate:'5',years:'10',frequency:'1'});
    expect(result.metrics[0].value).toBeCloseTo(10000 * 1.05 ** 10, 2);
    const equivalent = definition.modes.find(mode=>mode.id==='equivalent')!;
    expect(equivalent).toBeDefined();
    const converted = await calculate('finance', equivalent, {...defaults(equivalent),rate:'12',frequency:'12',target:'1'});
    expect(converted.metrics[0].value).toBeCloseTo(((1 + .12 / 12) ** 12 - 1) * 100, 4);
  });

  it('keeps translated search and selectively restores every displayed card description', async () => {
    for (const locale of locales.filter(locale=>locale!=='en')) {
      const messages = await getDictionary(locale), shared = sharedMessages(messages);
      expect(Object.keys(shared).some(key=>key.startsWith('description.'))).toBe(false);
      const related = relatedTools(toolMap.get('bmi-calculator')!);
      const cards = cardMessages(messages,related);
      expect(Object.keys(cards)).toHaveLength(6);
      for (const tool of catalog) {
        expect(shared[`tool.${tool.slug}`]).toBe(messages[`tool.${tool.slug}`]);
        expect(cardMessages(messages,[tool])[`description.${tool.slug}`]).toBe(messages[`description.${tool.slug}`]);
      }
      const query = messages['tool.compound-interest-calculator'];
      expect(searchCalculators(query,undefined,shared)[0].slug).toBe('compound-interest-calculator');
      expect(JSON.stringify(shared).length + JSON.stringify(cards).length).toBeLessThan(JSON.stringify(messages).length);
    }
  });

  it('renders translated guide links in server HTML with valid destinations', async () => {
    for (const [slug, tools] of Object.entries(guideCalculators)) {
      expect(guides[slug]).toBeDefined();
      for (const tool of tools) expect(definitionMap.has(tool),tool).toBe(true);
    }
    for (const locale of locales) {
      const messages = await getContentDictionary(locale), t = translator(messages);
      const html = renderToStaticMarkup(<RelatedGuides slug="bmi-calculator" locale={locale} messages={messages}/>);
      expect(html).toContain(`href="${locale==='en'?'':`/${locale}`}/guides/bmi-as-a-screening-tool"`);
      expect(html).toContain(renderToStaticMarkup(t(guides['bmi-as-a-screening-tool'].title)));
    }
  });

  it('aligns guide authorship and localized breadcrumbs without invented review dates', () => {
    const data = guideData('Guía','Descripción','/guides/bmi-as-a-screening-tool','es');
    expect(data.author.name).toBe('Finflo');
    expect(data.author['@type']).toBe('Organization');
    expect(data.author.url).toBe('https://finflo.org/es/about');
    expect(data).not.toHaveProperty('dateModified');
    const crumbs = breadcrumbData([{name:'Inicio',path:'/'},{name:'Guías',path:'/guides'}],'es');
    expect(crumbs.itemListElement.map(item=>item.item)).toEqual(['https://finflo.org/es','https://finflo.org/es/guides']);
    expect(pageMetadata('Free calculators','Description','/').title).toEqual({absolute:'Free calculators | Finflo'});
  });

  it('preserves the negative privacy promise and provider identities in Hindi', async () => {
    const messages = await getContentDictionary('hi');
    expect(messages['Cookies, advertising, and analytics']).toBe('कुकीज़, विज्ञापन और विश्लेषण');
    expect(messages['FOSSGIS routing and privacy information']).toContain('FOSSGIS');
    expect(messages['Nominatim privacy policy']).toContain('Nominatim');
    const promise = Object.entries(messages).find(([key])=>key.startsWith('Most Finflo calculations run in your browser without an account.'))![1];
    expect(promise).toContain('न किसी एप्लिकेशन डेटाबेस में सहेजता है');
    expect(promise).toContain('न अगली विज़िट पर उन्हें बहाल करता है');
  });
});
