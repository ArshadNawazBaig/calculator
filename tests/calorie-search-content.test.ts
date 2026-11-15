import {describe, expect, it} from 'vitest';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults, type Result, type Values} from '@/lib/calculators/types';
import {updateInputs} from '@/lib/calculators/input-display';

const definition = definitionMap.get('calorie-calculator')!;
const energy = definition.modes.find(mode => mode.id === 'energy')!;
async function run(id: string, inputs: Values) {
  const mode = definition.modes.find(mode => mode.id === id)!;
  return calculate('health', mode, {...defaults(mode), ...inputs});
}
const value = (result: Result, label: string) => Number(result.metrics.find(metric => metric.label === label)!.value);

describe('calorie page worked examples', () => {
  it.each([
    ['mifflin', 1648.75, 1978.5],
    ['harris', 1695.667, 2034.8004],
    ['katch', 1579.6, 1895.52],
  ])('keeps the %s resting estimate separate from its activity-adjusted total', async (method, resting, maintenance) => {
    const result = await run('energy', {sex: 'male', age: '30', weight: '70', height: '175', units: 'metric', method: String(method), fat: '20', activity: '1.2'});
    expect(value(result, 'Estimated resting energy')).toBeCloseTo(Number(resting), 8);
    expect(value(result, 'Estimated maintenance energy')).toBeCloseTo(Number(maintenance), 8);
    expect(value(result, 'Maintenance energy in kilojoules')).toBeCloseTo(Number(maintenance) * 4.184, 8);
  });

  it.each([
    ['1', 1648.75, 1649],
    ['1.2', 1978.5, 1979],
    ['1.375', 2267.03125, 2267],
    ['1.465', 2415.41875, 2415],
    ['1.55', 2555.5625, 2556],
    ['1.725', 2844.09375, 2844],
    ['1.9', 3132.625, 3133],
  ])('reproduces the activity-table scenario %s without changing resting energy', async (activity, expected, rounded) => {
    const result = await run('energy', {sex: 'male', age: '30', weight: '70', height: '175', units: 'metric', method: 'mifflin', activity: String(activity)});
    const actual = value(result, 'Estimated maintenance energy');
    expect(actual).toBeCloseTo(Number(expected), 8);
    expect(Math.round(actual)).toBe(rounded);
    expect(value(result, 'Estimated resting energy')).toBe(1648.75);
  });

  it('preserves the example estimate when the UI converts metric measurements to US units', async () => {
    const metricInputs = {...defaults(energy), units: 'metric', weight: '70', height: '175', age: '30', sex: 'male', method: 'mifflin', activity: '1.2'};
    const usInputs = updateInputs(energy, metricInputs, 'units', 'us');
    expect(Number(usInputs.weight)).toBeCloseTo(154.3235835294, 8);
    expect(Number(usInputs.height)).toBeCloseTo(68.8976377953, 8);
    const metric = await calculate('health', energy, metricInputs);
    const us = await calculate('health', energy, usInputs);
    expect(value(us, 'Estimated maintenance energy')).toBeCloseTo(value(metric, 'Estimated maintenance energy'), 7);
    const height = definitionMap.get('height-calculator')!.modes.find(mode => mode.id === 'converter')!;
    const converted = await calculate('everyday', height, {...defaults(height), feet: '5', inches: '9', direction: 'feet-inches-to-cm'});
    expect(converted.metrics.some(metric => metric.value === 175.26)).toBe(true);
  });

  it.each([
    ['100', 418.4, 418400], ['250', 1046, 1046000], ['500', 2092, 2092000],
  ])('reconciles the %s-kcal reference row across kcal, kJ, cal and J', async (amount, kilojoules, joules) => {
    const result = await run('energy-units', {value: String(amount), from: 'kcal'});
    expect(value(result, 'Kilocalories')).toBe(Number(amount));
    expect(value(result, 'Kilojoules')).toBe(kilojoules);
    expect(value(result, 'Joules')).toBe(joules);
    expect(value(result, 'Small calories')).toBeCloseTo(Number(amount) * 1000, 7);
    const inverse = await run('energy-conversion', {value: String(kilojoules), from: 'kj'});
    expect(value(inverse, 'Kilocalories')).toBeCloseTo(Number(amount), 9);
  });

  it('converts the serving-size example after scaling the portion, rather than the label serving', async () => {
    const portionCalories = 180 * (67.5 / 45);
    const result = await run('energy-conversion', {value: String(portionCalories), from: 'kcal'});
    expect(value(result, 'Kilocalories')).toBe(270);
    expect(value(result, 'Kilojoules')).toBeCloseTo(1129.68, 8);
    expect(180 / 45 * 100).toBe(400);
  });

  it('requires the stated adult age range and a body-fat entry only for the equation that uses it', async () => {
    await expect(run('energy', {age: '19'})).rejects.toThrow('Age must be at least 20');
    await expect(run('energy', {age: '20', method: 'mifflin', fat: ''})).resolves.toBeDefined();
    await expect(run('energy', {method: 'katch', fat: ''})).rejects.toThrow('Body fat (Katch only) is required');
  });
});
