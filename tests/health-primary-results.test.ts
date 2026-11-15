import {describe, expect, it} from 'vitest';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults} from '@/lib/calculators/types';

async function run(slug: string, modeId: string) {
  const mode = definitionMap.get(slug)!.modes.find(mode => mode.id === modeId)!;
  return calculate('health', mode, defaults(mode));
}

describe('nutrient pages emphasize the requested quantity', () => {
  it('shows carbohydrate grams first without losing the other allocations', async () => {
    const result = await run('carbohydrate-calculator', 'split');
    expect(result.metrics[0]).toMatchObject({label: 'Carbohydrate', value: 250, unit: 'g/day'});
    expect(result.metrics.find(metric => metric.label === 'Protein')?.value).toBe(100);
    expect(result.metrics.find(metric => metric.label === 'Fat')?.value).toBeCloseTo(2000 * .3 / 9, 10);
    expect(result.metrics).toHaveLength(3);
  });

  it('shows fat grams first without changing the energy arithmetic', async () => {
    const result = await run('fat-intake-calculator', 'split');
    expect(result.metrics[0]).toMatchObject({label: 'Fat', unit: 'g/day'});
    expect(result.metrics[0].value).toBeCloseTo(2000 * .3 / 9, 10);
    expect(result.metrics.find(metric => metric.label === 'Carbohydrate')?.value).toBe(250);
  });

  it.each([
    ['carbohydrate-calculator', 'Carbohydrate reference', '222.6–321.5'],
    ['fat-intake-calculator', 'Fat reference', '44.0–76.9'],
    ['protein-calculator', 'Protein energy reference', '49.5–173.1'],
  ])('shows the %s reference with its energy assumptions retained', async (slug, label, value) => {
    const result = await run(slug, 'energy-ranges');
    expect(result.metrics[0]).toMatchObject({label, value, unit: 'g/day'});
    expect(result.metrics.find(metric => metric.label === 'Estimated maintenance energy')?.value).toBeCloseTo(1978.5, 10);
    expect(result.metrics).toHaveLength(5);
    expect(result.notes?.join(' ')).toContain('do not establish an appropriate individual diet');
  });

  it('preserves the general macro calculator and direct protein result', async () => {
    const split = await run('macro-calculator', 'split');
    expect(split.metrics.map(metric => metric.label)).toEqual(['Protein', 'Carbohydrate', 'Fat']);
    expect((await run('macro-calculator', 'energy-ranges')).metrics[0].label).toBe('Estimated maintenance energy');
    expect((await run('protein-calculator', 'protein')).metrics[0].value).toBe(56);
  });
});
