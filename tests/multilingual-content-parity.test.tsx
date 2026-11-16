import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {locales} from '@/lib/i18n/config';
import {getContentDictionary} from '@/lib/i18n/content';
import {LanguageProvider} from '@/components/i18n/provider';
import {MathSearchAnswer, MathSearchContent} from '@/components/content/math-search-content';
import {InfoPage} from '@/components/content/info-page';
import {GeometryMeasurementGuide, GeometryModePicker} from '@/components/calculators/geometry-controls';
import {MaterialMeasurementDiagram, materialMeasurement} from '@/components/calculators/material-measurement-diagram';
import {CalculatorArticle} from '@/components/i18n/calculator-article';
import {mathSearchContent} from '@/data/math-search-content';
import {practicalGuides} from '@/data/practical-guides';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults} from '@/lib/calculators/types';
import {getToolkitEditorial} from '@/lib/toolkit-editorial';
import {site} from '@/lib/site';

describe('current content reaches every language', () => {
  it.each(locales.filter(locale => locale !== 'en'))('%s includes current formula references, practical guide tables and geometry controls', async locale => {
    const messages = await getContentDictionary(locale);
    const reference = mathSearchContent['area-calculator']!;
    const math = renderToStaticMarkup(<><MathSearchAnswer slug="area-calculator" messages={messages}/><MathSearchContent slug="area-calculator" messages={messages} locale={locale}/></>);
    expect(messages[reference.answer], locale).toBeTruthy();
    expect(messages[reference.answer], locale).not.toBe(reference.answer);
    expect(math).not.toContain(reference.answer);
    expect(math).toContain(`href="/${locale}/triangle-calculator"`);
    expect(math.match(/scope="row"/g)).toHaveLength(reference.rows.length);
    expect(math).toContain('id="method-triangle-sss"');
    expect(math).not.toContain('Scroll sideways to see all columns.');

    for (const [slug, guide] of Object.entries(practicalGuides)) {
      const html = renderToStaticMarkup(<LanguageProvider locale={locale} messages={messages}><InfoPage page={guide} guide slug={slug} messages={messages} locale={locale}/></LanguageProvider>);
      expect(messages[guide.description], `${locale}/${slug}`).toBeTruthy();
      expect(html).not.toContain(guide.description);
      expect(html.match(/<caption>/g) || []).toHaveLength(guide.sections.filter(section => section.table).length);
      for (const [index, section] of guide.sections.entries()) {
        expect(html).toContain(`id="guide-section-${index + 1}"`);
        for (const paragraph of section.paragraphs) {
          expect(messages[paragraph], `${locale}/${slug}: ${paragraph}`).toBeTruthy();
          expect(html).not.toContain(paragraph);
        }
      }
    }

    const definition = definitionMap.get('area-calculator')!;
    const mode = definition.modes[0];
    const controls = renderToStaticMarkup(<><GeometryModePicker slug={definition.slug} modes={definition.modes} selected={mode.id} disabled onChange={() => {}} messages={messages}/><GeometryMeasurementGuide slug={definition.slug} mode={mode} values={defaults(mode)} messages={messages}/></>);
    expect(controls).not.toContain('Choose a shape');
    expect(controls).not.toContain('Diagram is not to scale.');
    expect(controls).not.toContain('Which measurements do I need?');
    expect(controls).not.toContain(mode.explanation);

    const concrete = definitionMap.get('concrete-calculator')!;
    const materialProps = {slug: concrete.slug, mode: concrete.modes[0], values: defaults(concrete.modes[0])};
    const measurement = materialMeasurement(materialProps)!;
    const material = renderToStaticMarkup(<MaterialMeasurementDiagram {...materialProps} messages={messages}/>);
    expect(measurement).toBeDefined();
    expect(messages[measurement.hint], locale).toBeTruthy();
    expect(material).toContain(renderToStaticMarkup(<p>{messages[measurement.hint]}</p>));
    expect(material).not.toContain('Which measurements do I need?');
    expect(material).not.toContain(measurement.description);

    const invoice = definitionMap.get('invoice-generator')!;
    const editorial = getToolkitEditorial(invoice.slug)!;
    const article = renderToStaticMarkup(<LanguageProvider locale={locale} messages={messages}><CalculatorArticle definition={invoice} initial={null} currency="USD" locale={locale} messages={messages}/></LanguageProvider>);
    expect(messages[editorial.quickAnswer], locale).toBeTruthy();
    expect(article).toContain(renderToStaticMarkup(<p>{messages[editorial.quickAnswer]}</p>));
    for (const method of invoice.modes) expect(article).toContain(`href="#mode-${method.id}"`);
    const schemas = [...article.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    const schema = schemas.find(data => data['@type'] === 'Article');
    expect(schema.inLanguage).toBe(locale);
    expect(schema.url).toBe(`${site.url}/${locale}/invoice-generator`);
    expect(schema.headline).toBe(messages[editorial.seoTitle]);
    expect(article).toContain(`href="/${locale}/methodology"`);
  });
});
