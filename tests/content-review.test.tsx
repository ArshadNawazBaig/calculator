import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {WorkedExample} from '@/components/content/worked-example';
import {catalog, definitions, definitionMap, noInitialExampleTools} from '@/lib/calculators/registry';
import {calculate} from '@/lib/calculators/engine';
import {defaults, type Values} from '@/lib/calculators/types';
import {getContentDictionary} from '@/lib/i18n/content';
import {locales} from '@/lib/i18n/config';

// Expected values are independently evaluated examples published in the guide text.
const cases: [string, string, Values, Record<string, number | string>][] = [
  ['average-return-calculator', 'returns', {returns: '50, -50'}, {'Arithmetic average': 0, 'Cumulative return': -25, 'Geometric average': -13.3974596215561}],
  ['margin-calculator', 'calculate', {cost: '80', price: '100'}, {'Profit': 20, 'Profit margin': 20, 'Markup': 25}],
  ['margin-calculator', 'target', {cost: '80', margin: '30', solve: 'price'}, {'Selling price': 114.285714285714}],
  ['discount-calculator', 'calculate', {price: '120', rate: '25', fixed: '10', tax: '0'}, {'Price before tax': 80}],
  ['discount-calculator', 'calculate', {price: '120', rate: '25', fixed: '10', tax: '10'}, {'Price before tax': 80, 'Final price with tax': 88}],
  ['sales-tax-calculator', 'tax', {amount: '108', rate: '8', direction: 'inclusive'}, {'Net amount': 100, 'Tax amount': 8}],
  ['vat-calculator', 'tax', {amount: '120', rate: '20', direction: 'inclusive'}, {'Net amount': 100, 'Tax amount': 20}],
  ['debt-ratio-calculator', 'ratio', {income: '5000', housing: '1200', debt: '400'}, {'Total debt-to-income ratio': 32}],
  ['body-type-calculator', 'ratios', {waist: '80', hip: '100', height: '175', units: 'metric'}, {'Waist-to-hip ratio': 0.8, 'Waist-to-height ratio': 0.457142857142857}],
  ['bmr-calculator', 'energy', {weight: '70', height: '175', age: '30', sex: 'male', method: 'mifflin', units: 'metric'}, {'Estimated resting energy': 1648.75}],
  ['tdee-calculator', 'energy', {weight: '65.125', height: '175', age: '30', activity: '1.2'}, {'Estimated resting energy': 1600, 'Estimated maintenance energy': 1920}],
  ['tdee-calculator', 'energy', {weight: '65.125', height: '175', age: '30', activity: '1.55'}, {'Estimated resting energy': 1600, 'Estimated maintenance energy': 2480}],
  ['average-calculator', 'summary', {data: '10, 12, 14, 100'}, {'Mean': 34, 'Median': 13, 'Sum': 136}],
  ['standard-deviation-calculator', 'summary', {data: '2, 4, 6'}, {'Mean': 4, 'Sample variance': 4, 'Sample standard deviation': 2, 'Population standard deviation': 1.63299316185545}],
  ['confidence-interval-calculator', 'mean', {mean: '100', sd: '15', size: '100', confidence: '95', method: 'z'}, {'Lower bound': 97.0600540231899, 'Upper bound': 102.93994597681}],
  ['probability-calculator', 'events', {a: '0.4', b: '0.3', relation: 'independent'}, {'P(A or B)': 0.58, 'P(A and B)': 0.12}],
  ['ratio-calculator', 'scale', {a: '2', b: '3', factor: '4', direction: 'enlarge'}, {'Scaled ratio': '8 : 12'}],
  ['sample-size-calculator', 'sample', {confidence: '95', proportion: '50', margin: '5', population: '0'}, {'Required sample size': 385}],
  ['sample-size-calculator', 'sample', {confidence: '95', proportion: '50', margin: '2.5', population: '0'}, {'Required sample size': 1537}],
  ['permutation-and-combination-calculator', 'count', {n: '5', r: '3'}, {'Combinations': 10, 'Permutations': 60}],
  ['date-calculator', 'difference', {start: '2026-01-01', end: '2026-01-03', inclusive: 'no'}, {'Days': 2}],
  ['date-calculator', 'difference', {start: '2026-01-01', end: '2026-01-03', inclusive: 'yes'}, {'Days': 3}],
  ['date-calculator', 'add', {start: '2026-01-31', months: '1'}, {'Result date': '2026-02-28'}],
  ['electricity-calculator', 'energy', {watts: '1500', hours: '4', days: '30', price: '0.20'}, {'Energy used': 180, 'Energy charge': 36}],
  ['density-calculator', 'calculate', {mass: '0.054', volume: '0.00002'}, {'Density': 2700}],
  ['molarity-calculator', 'molarity', {mass: '5.844', molarMass: '58.44', volume: '1'}, {'Molarity': 0.1}],
  ['molarity-calculator', 'molarity', {mass: '5.844', molarMass: '58.44', volume: '0.1'}, {'Molarity': 1}],
  ['tire-size-calculator', 'compare', {a: '205/55R16'}, {'Current diameter': 631.9}],
  ['ohms-law-calculator', 'ohm', {pair: 'vr', a: '12', b: '6'}, {'Current': 2, 'Power': 24}],
  ['ohms-law-calculator', 'ohm', {pair: 'vr', a: '12', b: '6000'}, {'Current': 0.002}],
];

describe('content review: numerical examples', () => {
  it.each(cases)('%s / %s matches the published calculation', async (slug, id, inputs, expected) => {
    const mode = definitionMap.get(slug)!.modes.find(mode => mode.id === id)!;
    const result = await calculate(catalog.find(tool => tool.slug === slug)!.category, mode, {...defaults(mode), ...inputs});
    const metrics = Object.fromEntries(result.metrics.map(metric => [metric.label, metric.value]));
    for (const [label, value] of Object.entries(expected)) {
      if (typeof value === 'number') expect(Number(metrics[label]), label).toBeCloseTo(value, 6);
      else expect(metrics[label], label).toBe(value);
    }
  });

  it.each([['MB', 40], ['MiB', 41.94304]])('distinguishes %s from bits and binary units', async (unit, seconds) => {
    const mode = definitionMap.get('bandwidth-calculator')!.modes.find(mode => mode.id === 'measured-transfer')!;
    const result = await calculate('everyday', mode, {...defaults(mode), size: '100', sizeUnit: String(unit), rate: '20', rateUnit: 'Mbit/s'});
    expect(Number(result.metrics[0].value)).toBeCloseTo(Number(seconds), 6);
  });
});

describe('content review: readable server examples', () => {
  it('renders every deterministic default without exposing serialized row data', async () => {
    for (const definition of definitions.filter(definition => !noInitialExampleTools.has(definition.slug))) {
      const mode = definition.modes[0];
      const result = await calculate(catalog.find(tool => tool.slug === definition.slug)!.category, mode, defaults(mode));
      const html = renderToStaticMarkup(<WorkedExample mode={mode} result={result} currency="USD"/>);
      expect(html, definition.slug).toContain('id="example"');
      expect(html, definition.slug).not.toMatch(/\[\{(?:&quot;|")/);
      expect((html.match(/<strong /g) || []).length, definition.slug).toBe(result.metrics.length);
    }
  });

  it.each(locales.filter(locale => locale !== 'en'))('renders readable %s grade rows and preserves blank scores', async locale => {
    const mode = definitionMap.get('grade-calculator')!.modes[0];
    const result = await calculate('everyday', mode, defaults(mode));
    const messages = await getContentDictionary(locale);
    const html = renderToStaticMarkup(<WorkedExample mode={mode} result={result} currency="USD" messages={messages} locale={locale}/>);
    expect(html).toContain('<table>');
    expect(html).toContain(messages['Not entered']);
    expect(html).toContain(messages['Homework']);
    expect(html).not.toContain('Example result');
    expect(html).not.toContain('&quot;score&quot;');
    expect(html).not.toContain('Blank current scores are excluded');
  });
});
