import {describe, expect, it} from 'vitest';
import {calculate} from '@/lib/calculators/engine';
import {displayField} from '@/lib/calculators/input-display';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults, type Values} from '@/lib/calculators/types';

const mode = (slug: string, id: string) => definitionMap.get(slug)!.modes.find(item => item.id === id)!;
async function scientific(values: Values) {
  const selected = mode('scientific-notation-calculator', 'arithmetic');
  return calculate('math', selected, {...defaults(selected), operation: '+', b: '0', ...values});
}

describe('scientific notation presents the same rounded value in each form', () => {
  it.each([
    ['999.9', '1.00e+3', '1 × 10^3', '1000'],
    ['-999.9', '-1.00e+3', '-1 × 10^3', '-1000'],
    ['0.0009999', '1.00e-3', '1 × 10^-3', '0.001'],
  ])('normalizes an engineering exponent after rounding %s', async (input, notation, engineering, decimal) => {
    const result = await scientific({a: input, digits: '3'});
    expect(result.metrics.map(item => item.value)).toEqual([notation, engineering, decimal]);
  });

  it.each([
    ['1e30', '2000000000000000000000000000000'],
    ['1e-30', '0.000000000000000000000000000002'],
  ])('expands %s to actual decimal notation', async (a, expected) => {
    const result = await scientific({a, b: '2', operation: '*', digits: '3'});
    expect(result.metrics.find(item => item.label === 'Decimal')!.value).toBe(expected);
  });

  it('keeps zero defined and output bounded at the supported exponent limit', async () => {
    expect((await scientific({a: '0', digits: '3'})).metrics.map(item => item.value)).toEqual(['0.00e+0', '0 × 10^0', '0']);
    const result = await scientific({a: '1e10000', digits: '3'});
    const decimal = String(result.metrics.find(item => item.label === 'Decimal')!.value);
    expect(decimal).toHaveLength(10001);
    expect(decimal).toMatch(/^10+$/);
  });

  it('accepts both formats promised by the input hint and identifies the power exponent', async () => {
    const selected = mode('scientific-notation-calculator', 'notation');
    const field = displayField(selected, selected.fields[0], defaults(selected));
    expect(field.hint).toContain('1.23 × 10^7');
    for (const value of ['1.23e7', '1.23 × 10^7']) {
      const result = await calculate('math', selected, {value});
      expect(result.metrics.find(item => item.label === 'Decimal form')!.value).toBe('12300000');
    }
    const power = mode('scientific-notation-calculator', 'arithmetic');
    expect(displayField(power, power.fields.find(item => item.key === 'b')!, {...defaults(power), operation: 'power'}).label).toBe('Whole-number exponent');
    expect((await scientific({a: '2', b: '3', operation: 'power', digits: '3'})).metrics[0].value).toBe('8.00e+0');
  });
});

describe('elapsed time defaults match a duration rather than a payroll assumption', () => {
  it('starts with the complete interval while retaining the Hours Calculator break example', async () => {
    const elapsed = mode('time-duration-calculator', 'duration');
    const hours = mode('hours-calculator', 'duration');
    expect(defaults(elapsed).break).toBe('0');
    expect(defaults(hours).break).toBe('30');
    expect((await calculate('everyday', elapsed, defaults(elapsed))).metrics.map(item => item.value)).toEqual(['08:30:00', 8.5]);
    expect((await calculate('everyday', hours, defaults(hours))).metrics.map(item => item.value)).toEqual(['08:00:00', 8]);
  });

  it('subtracts only the requested break from an overnight interval', async () => {
    const elapsed = mode('time-duration-calculator', 'duration');
    const values = {...defaults(elapsed), start: '22:15', end: '06:45'};
    expect((await calculate('everyday', elapsed, values)).metrics.map(item => item.value)).toEqual(['08:30:00', 8.5]);
    expect((await calculate('everyday', elapsed, {...values, break: '30'})).metrics.map(item => item.value)).toEqual(['08:00:00', 8]);
  });
});
