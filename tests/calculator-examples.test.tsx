import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {renderToStaticMarkup} from 'react-dom/server';
import sharp from 'sharp';
import {describe, expect, it} from 'vitest';
import {CalculatorExample} from '@/components/content/calculator-example';
import {calculatorExamples, exampleImage} from '@/lib/calculator-examples';
import {calculate} from '@/lib/calculators/engine';
import {catalog, definitionMap} from '@/lib/calculators/registry';
import {defaults, type Values} from '@/lib/calculators/types';
import {locales} from '@/lib/i18n/config';
import {getContentDictionary} from '@/lib/i18n/content';
import type {CategoryId} from '@/lib/site';

describe('illustrated calculator examples', () => {
  it('covers the rest of the catalog with distinct examples and correctly sized artwork', async () => {
    const slugs = catalog.filter(tool => tool.slug !== 'volume-calculator').map(tool => tool.slug);
    expect(Object.keys(calculatorExamples).sort()).toEqual(slugs.sort());
    expect(new Set(Object.values(calculatorExamples).map(example => example.title)).size).toBe(slugs.length);
    const hashes = await Promise.all(slugs.map(async slug => {
      const example = calculatorExamples[slug];
      expect(example.rows, slug).toHaveLength(2);
      for (const row of example.rows) {
        expect(Boolean(row.label) !== Boolean(row.input), slug).toBe(true);
        expect(row.calculation && row.result, slug).toBeTruthy();
      }
      const bytes = await readFile('public' + exampleImage(slug));
      expect(await sharp(bytes).metadata(), slug).toMatchObject({format: 'webp', width: 1200, height: 630});
      return createHash('sha256').update(bytes).digest('hex');
    }));
    expect(new Set(hashes).size).toBe(slugs.length);
    expect(renderToStaticMarkup(<CalculatorExample slug="volume-calculator"/>)).toBe('');
  });

  it('has translated headings, inputs and row labels for every published version', async () => {
    const missing: string[] = [];
    await Promise.all(locales.filter(locale => locale !== 'en').map(async locale => {
      const files = await Promise.all(['content/', ''].map(prefix => readFile(`src/data/locales/${prefix}${locale}.json`, 'utf8')));
      const messages: Record<string, string> = Object.assign({}, ...files.map(file => JSON.parse(file)));
      for (const [slug, example] of Object.entries(calculatorExamples)) {
        const labels = [example.title, example.inputHeading, example.resultHeading,
          ...(example.note ? [example.note] : []),
          ...(example.given || []).map(given => given.label), ...example.rows.flatMap(row => row.label ? [row.label] : [])];
        for (const label of labels) if (!messages[label]?.trim()) missing.push(`${locale}/${slug}: ${label}`);
        if (messages[example.title] === example.title) missing.push(`${locale}/${slug}: ${example.title}`);
      }
    }));
    expect(missing).toEqual([]);
  });

  it('keeps translated results, equations and table relationships in the initial HTML', async () => {
    const html = renderToStaticMarkup(<CalculatorExample slug="surface-area-calculator" locale="de" messages={await getContentDictionary('de')} nested/>);
    expect(html).toContain('<h3 id="illustrated-example-title">');
    expect(html).toContain('<caption class="sr-only">');
    expect(html.match(/scope="col"/g)).toHaveLength(3);
    expect(html.match(/scope="row"/g)).toHaveLength(2);
    expect(html).toContain('2 × π × 3 × 5 + π × 3^2');
    expect(html).toContain('122,52 cm²');
    expect(html).toContain('src="/illustrations/examples/surface-area-calculator.webp"');
    expect(html).toContain('loading="lazy"');
    expect(html).not.toContain(calculatorExamples['surface-area-calculator'].title);
  });

  const engineCases: {slug: string; category: CategoryId; mode: string; inputs: Values[]; places: number}[] = [
    {slug: 'break-even-calculator', category: 'finance', mode: 'units', places: 0,
      inputs: ['50', '45'].map(price => ({fixedCost: '3000', variableCost: '30', price}))},
    {slug: 'bmi-calculator', category: 'health', mode: 'adult', places: 2,
      inputs: ['170', '172'].map(height => ({weight: '70', height, units: 'metric'}))},
    {slug: 'wind-chill-calculator', category: 'everyday', mode: 'nws', places: 0,
      inputs: ['10', '20'].map(wind => ({temperature: '35', wind}))},
    {slug: 'heat-index-calculator', category: 'everyday', mode: 'nws', places: 0,
      inputs: ['85', '90'].map(temperature => ({temperature, humidity: '60'}))},
  ];
  it.each(engineCases)('matches the interactive result on $slug', async ({slug, category, mode: id, inputs, places}) => {
    const mode = definitionMap.get(slug)!.modes.find(entry => entry.id === id)!;
    for (const [index, overrides] of inputs.entries()) {
      const result = await calculate(category, mode, {...defaults(mode), ...overrides});
      const printed = Number(result.metrics[0].value).toFixed(places);
      expect(calculatorExamples[slug].rows[index].result.split(' ')[0]).toBe(printed);
    }
  });
});
