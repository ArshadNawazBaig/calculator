import {describe, expect, it} from 'vitest';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults, type Values} from '@/lib/calculators/types';

async function run(kind: 'volume' | 'surface-area', shape: string, values: Values = {}) {
  const mode = definitionMap.get(`${kind}-calculator`)!.modes.find(mode => mode.id === shape)!;
  return calculate('math', mode, {...defaults(mode), ...values});
}

describe('solid measurements, units and calculation steps', () => {
  it('converts each box dimension before applying cubic or square units', async () => {
    const inputs = {a: '2', aUnit: 'ft', b: '12', bUnit: 'in', h: '0.5', hUnit: 'ft', outputUnit: 'ft'};
    const volume = await run('volume', 'cuboid', inputs);
    const area = await run('surface-area', 'cuboid', inputs);
    expect(volume.metrics[0].unit).toBe('ft³');
    expect(volume.metrics[0].value).toBeCloseTo(1, 12);
    expect(area.metrics[0].unit).toBe('ft²');
    expect(area.metrics[0].value).toBeCloseTo(7, 12);
    expect(volume.explanation).toContain('V = 2 × 1 × 0.5 = 1 ft³');
    expect(area.explanation).toContain('= 7 ft²');
  });

  it.each(['volume', 'surface-area'] as const)('provides a worked %s substitution for every solid', async kind => {
    const modes = definitionMap.get(`${kind}-calculator`)!.modes.filter(mode => mode.id !== 'cap-inverse');
    for (const mode of modes) {
      const result = await run(kind, mode.id);
      expect(result.explanation, mode.id).toContain(kind === 'volume' ? 'V =' : mode.id === 'ellipsoid' ? 'A ≈' : 'A =');
      expect(result.explanation, mode.id).toContain(kind === 'volume' ? 'm³' : 'm²');
      expect(result.explanation, mode.id).not.toMatch(/square units|cubic units/);
    }
  });

  it('treats capsule height as its straight section and includes both hemispheres', async () => {
    const volume = await run('volume', 'capsule', {r: '2', h: '6'});
    const area = await run('surface-area', 'capsule', {r: '2', h: '6'});
    expect(volume.metrics[0].value).toBeCloseTo(104 * Math.PI / 3, 10);
    expect(area.metrics[0].value).toBeCloseTo(40 * Math.PI, 10);
  });

  it('includes the flat cap base in total surface area', async () => {
    const result = await run('surface-area', 'cap', {r: '5', h: '2'});
    expect(result.metrics[0].value).toBeCloseTo(36 * Math.PI, 10);
  });

  it('calculates hollow material and both annular ends', async () => {
    const inputs = {r: '3', r2: '2', h: '5'};
    expect((await run('volume', 'tube', inputs)).metrics[0].value).toBeCloseTo(25 * Math.PI, 10);
    expect((await run('surface-area', 'tube', inputs)).metrics[0].value).toBeCloseTo(60 * Math.PI, 10);
  });

  it('preserves finite ellipsoid surface areas when fractional-power intermediates would overflow', async () => {
    const result = await run('surface-area', 'ellipsoid', {a: '1e100', b: '1e100', c: '1e100'});
    expect(Number(result.metrics[0].value) / 1e200).toBeCloseTo(4 * Math.PI, 10);
  });

  it('uses different powers for volume and surface-area output conversion', async () => {
    const input = {a: '1', aUnit: 'm', outputUnit: 'cm'};
    expect((await run('volume', 'cube', input)).metrics[0]).toMatchObject({value: 1e6, unit: 'cm³'});
    expect((await run('surface-area', 'cube', input)).metrics[0]).toMatchObject({value: 60000, unit: 'cm²'});
  });

  it('keeps alternate cap branches and their dimensions consistent', async () => {
    const result = await run('volume', 'cap-inverse', {known: 'sphere-base', r: '5', base: '4'});
    expect(result.metrics.find(metric => metric.label === 'Cap 1: height')?.value).toBeCloseTo(2, 12);
    expect(result.metrics.find(metric => metric.label === 'Cap 2: height')?.value).toBeCloseTo(8, 12);
    const volumes = result.metrics.filter(metric => /volume/.test(metric.label));
    expect(volumes).toHaveLength(2);
    expect(Number(volumes[0].value) + Number(volumes[1].value)).toBeCloseTo(4 * Math.PI * 125 / 3, 10);
    expect(volumes.every(metric => metric.unit === 'm³')).toBe(true);
  });

  it.each([
    ['volume', 'cube', {a: '1e-110'}], ['surface-area', 'sphere', {r: '1e-170'}],
    ['volume', 'cube', {a: '1e200'}], ['surface-area', 'cube', {a: '1e200'}],
    ['volume', 'cap', {r: '5', h: '11'}], ['surface-area', 'cap', {r: '5', h: '11'}],
    ['volume', 'tube', {r: '3', r2: '3'}], ['surface-area', 'tube', {r: '3', r2: '4'}],
    ['volume', 'cube', {a: '0'}], ['surface-area', 'cube', {a: '-1'}],
    ['volume', 'cap-inverse', {base: '1e-110', h: '1e-110'}],
    ['surface-area', 'cap-inverse', {known: 'sphere-base', base: '6', r: '5'}],
  ] satisfies ['volume' | 'surface-area', string, Values][])('rejects invalid %s %s dimensions %j', async (kind, shape, values) => {
    await expect(run(kind, shape, values)).rejects.toThrow();
  });
});
