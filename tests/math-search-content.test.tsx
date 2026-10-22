import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {MathSearchAnswer, MathSearchContent} from '@/components/content/math-search-content';
import {mathSearchContent} from '@/data/math-search-content';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults, type Values} from '@/lib/calculators/types';

async function run(slug: string, id: string, values: Values) {
  const mode = definitionMap.get(slug)!.modes.find(item => item.id === id)!;
  return calculate('math', mode, {...defaults(mode), ...values});
}

const areaExamples: Record<string, Values> = {
  rectangle: {a: '6', b: '4'}, triangle: {a: '8', b: '3'},
  'triangle-sss': {a: '5', b: '12', c: '13'}, circle: {r: '3'},
  sector: {r: '4', angle: '90'}, ellipse: {a: '4', b: '2'},
  trapezoid: {a: '4', b: '8', h: '3'}, parallelogram: {a: '7', h: '3'},
};

const volumeExamples: Record<string, Values> = {
  cuboid: {a: '6', b: '4', h: '2'}, cube: {a: '3'},
  cylinder: {r: '2', h: '5'}, sphere: {r: '3'}, cone: {r: '3', h: '4'},
  pyramid: {a: '6', b: '4', h: '3'}, ellipsoid: {a: '3', b: '2', c: '1'},
  capsule: {r: '2', h: '6'}, cap: {r: '5', h: '2'},
  frustum: {r: '4', r2: '2', h: '3'}, tube: {r: '3', r2: '2', h: '5'},
};

describe('published formula examples agree with the working calculator', () => {
  for (const [slug, examples, metricLabel] of [
    ['area-calculator', areaExamples, 'Area'],
    ['volume-calculator', volumeExamples, 'Volume'],
  ] as const) {
    for (const row of mathSearchContent[slug]!.rows) {
      it(`${slug}: ${row.label}`, async () => {
        expect(examples[row.id]).toBeDefined();
        const result = await run(slug, row.id, examples[row.id]);
        const metric = result.metrics.find(item => item.label === metricLabel)!;
        const displayed = new Intl.NumberFormat('en-US', {maximumFractionDigits: 2}).format(Number(metric.value));
        expect(`${displayed} ${metric.unit}`).toBe(row.result);
      });
    }
  }

  it('checks the simplified and scaled ratios in the reference table', async () => {
    const rows = mathSearchContent['ratio-calculator']!.rows;
    for (const [id, mode, values] of [
      ['simplify', 'simplify', {a: '18', b: '24'}],
      ['scale-enlarge', 'scale', {a: '3', b: '4', factor: '5', direction: 'enlarge'}],
      ['scale-shrink', 'scale', {a: '15', b: '20', factor: '5', direction: 'shrink'}],
    ] as [string, string, Values][]) {
      const result = await run('ratio-calculator', mode, values);
      expect(String(result.metrics[0].value).replaceAll(' ', '')).toBe(rows.find(row => row.id === id)!.result);
    }
    const decimals = await run('ratio-calculator', 'simplify', {a: '150', b: '225'});
    expect(decimals.metrics[0].value).toBe('2 : 3');
  });

  it.each(['A', 'B', 'C', 'D'])('checks the example for a missing %s term', async solve => {
    const result = await run('ratio-calculator', 'all-proportions', {solve, A: '3', B: '4', C: '9', D: '12'});
    const row = mathSearchContent['ratio-calculator']!.rows.find(item => item.id === `solve-${solve.toLowerCase()}`)!;
    expect(`${solve} = ${result.metrics[0].value}`).toBe(row.result);
  });

  it('checks the mixed-unit and capacity examples in the prose', async () => {
    const area = await run('area-calculator', 'rectangle', {a: '3', aUnit: 'ft', b: '24', bUnit: 'in', outputUnit: 'ft'});
    expect(area.metrics[0].value).toBeCloseTo(6, 12);
    expect(area.metrics[0].unit).toBe('ft²');
    const volume = await run('volume-calculator', 'cuboid', {a: '2', aUnit: 'ft', b: '12', bUnit: 'in', h: '6', hUnit: 'in', outputUnit: 'ft'});
    expect(volume.metrics[0].value).toBeCloseTo(1, 12);
    expect(volume.metrics[0].unit).toBe('ft³');
    const tank = await run('volume-calculator', 'cuboid', {a: '100', aUnit: 'cm', b: '50', bUnit: 'cm', h: '40', hUnit: 'cm', outputUnit: 'm'});
    expect(tank.metrics[0].value).toBeCloseTo(0.2, 12);
    expect(Number(tank.metrics[0].value) * 1000).toBeCloseTo(200, 12);
  });
});

describe('search guidance is readable in the initial server HTML', () => {
  it.each(Object.keys(mathSearchContent))('renders accessible references and real tool links for %s', slug => {
    const content = mathSearchContent[slug]!;
    const html = renderToStaticMarkup(<><MathSearchAnswer slug={slug}/><MathSearchContent slug={slug}/></>);
    expect(html).toContain(content.answer);
    expect(html).toContain('<caption>');
    expect(html.match(/scope="row"/g)).toHaveLength(content.rows.length);
    expect(html).toContain('aria-labelledby="formula-reference-heading" aria-describedby="formula-scroll-hint" tabindex="0"');
    for (const section of content.sections) {
      if (section.link) {
        expect(definitionMap.has(section.link.href.slice(1))).toBe(true);
        expect(html).toContain(`href="${section.link.href}"`);
      }
    }
  });

  it('does not add generic guidance to unrelated calculator pages', () => {
    expect(renderToStaticMarkup(<><MathSearchAnswer slug="mortgage-calculator"/><MathSearchContent slug="mortgage-calculator"/></>)).toBe('');
  });
});
