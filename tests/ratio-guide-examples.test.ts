import {describe, expect, it} from 'vitest';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults, type Values} from '@/lib/calculators/types';
import {ratioGuides} from '@/data/guides/ratio-guide';

async function run(slug: string, id: string, values: Values) {
  const selected = definitionMap.get(slug)!.modes.find(mode => mode.id === id)!;
  const result = await calculate('math', selected, {...defaults(selected), ...values});
  return Object.fromEntries(result.metrics.map(metric => [metric.label, metric.value]));
}

describe('sharing and scaling ratio guide examples', () => {
  it('allocates the full budget and recovers the same first share from the known second share', async () => {
    const scaled = await run('ratio-calculator', 'scale', {a: '3', b: '5', factor: '120', direction: 'enlarge'});
    expect(scaled['Scaled ratio']).toBe('360 : 600');
    const missing = await run('ratio-calculator', 'all-proportions', {solve: 'C', A: '3', B: '5', D: '600'});
    expect(missing['Term C']).toBe(360);
    expect(Number(missing['Term C']) + 600).toBe(960);
    const simplified = await run('ratio-calculator', 'simplify', {a: '360', b: '600'});
    expect(simplified['Simplified ratio']).toBe('3 : 5');
  });

  it.each([
    ['360', '960', 37.5],
    ['600', '960', 62.5],
    ['360', '600', 60],
  ])('uses the intended whole for %s out of %s', async (part, whole, expected) => {
    const answer = await run('percent-calculator', 'what', {part, whole});
    expect(answer.Percentage).toBe(expected);
  });

  it('scales the recipe batch while preserving both the ratio and the mass per portion', async () => {
    const scaled = await run('ratio-calculator', 'scale', {a: '300', b: '200', factor: '2.5', direction: 'enlarge'});
    expect(scaled['Scaled ratio']).toBe('750 : 500');
    const quantities = String(scaled['Scaled ratio']).split(' : ').map(Number);
    expect(quantities.reduce((sum, value) => sum + value, 0) / 10).toBe(125);
    for (const [a, b] of [['300', '200'], ['750', '500']]) {
      expect((await run('ratio-calculator', 'simplify', {a, b}))['Simplified ratio']).toBe('3 : 2');
    }
  });

  it('distinguishes multiplicative scaling from adding the same quantity', async () => {
    expect((await run('ratio-calculator', 'simplify', {a: '6', b: '10'}))['Simplified ratio']).toBe('3 : 5');
    expect((await run('ratio-calculator', 'simplify', {a: '6', b: '8'}))['Simplified ratio']).toBe('3 : 4');
  });

  it('shows why a non-divisible whole-item allocation needs a separate rounding decision', async () => {
    expect((await run('ratio-calculator', 'scale', {a: '3', b: '2', factor: '4', direction: 'enlarge'}))['Scaled ratio']).toBe('12 : 8');
    const first = await run('fraction-calculator', 'arithmetic', {a: '22', b: '3/5', operation: '*'});
    const second = await run('fraction-calculator', 'arithmetic', {a: '22', b: '2/5', operation: '*'});
    expect(first['Simplified fraction']).toBe('66/5');
    expect(second['Simplified fraction']).toBe('44/5');
    expect(Number(first['Approximate decimal'])).toBe(13.2);
    expect(Number(second['Approximate decimal'])).toBe(8.8);
    expect((await run('ratio-calculator', 'simplify', {a: '13', b: '9'}))['Simplified ratio']).toBe('13 : 9');
  });

  it('links each worked task to a real calculator mode', () => {
    for (const section of ratioGuides['sharing-and-scaling-ratios'].sections) {
      for (const link of section.links || []) {
        if (!link.href.startsWith('/')) continue;
        const [path, fragment] = link.href.split('#');
        const definition = definitionMap.get(path.slice(1));
        expect(definition, link.href).toBeDefined();
        expect(definition!.modes.some(mode => `mode-${mode.id}` === fragment), link.href).toBe(true);
      }
    }
  });
});
