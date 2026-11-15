import {describe, expect, it} from 'vitest';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults, type Values} from '@/lib/calculators/types';

const definition = definitionMap.get('ratio-calculator')!;
function run(id: string, values: Values) {
  const mode = definition.modes.find(item => item.id === id)!;
  return calculate('math', mode, {...defaults(mode), ...values});
}

describe('exact ratio simplification through the published calculator', () => {
  it.each([
    ['18', '24', '3 : 4'],
    ['1.5', '2.25', '2 : 3'],
    ['0.1', '.3', '1 : 3'],
    ['1/2', '3/4', '2 : 3'],
    ['1/3', '1/6', '2 : 1'],
    [' 1 / 2 ', '-3/4', '2 : -3'],
    ['1/-2', '3/4', '-2 : 3'],
    ['-12', '-18', '-2 : -3'],
    ['0', '4', '0 : 1'],
    ['-4', '0/3', '-1 : 0'],
    ['+2.', '+4.0', '1 : 2'],
    ['1e-3', '2.5E-3', '2 : 5'],
    ['1e12', '1000000000000', '1 : 1'],
    ['1e-100', '2e-100', '1 : 2'],
  ])('simplifies %s : %s to %s', async (a, b, expected) => {
    expect((await run('simplify', {a, b})).metrics[0].value).toBe(expected);
  });

  it('retains decimal and fraction digits beyond floating-point precision', async () => {
    const decimal = await run('simplify', {a: '1.00000000000000000001', b: '1'});
    expect(decimal.metrics[0].value).toBe('100000000000000000001 : 100000000000000000000');
    const fractional = await run('simplify', {a: '1/9007199254740993', b: '1/9007199254740992'});
    expect(fractional.metrics[0].value).toBe('9007199254740992 : 9007199254740993');
  });

  it('shows the exact conversion and divisor for a fractional ratio', async () => {
    const result = await run('simplify', {a: '1/2', b: '3/4'});
    expect(result.table?.rows).toContainEqual(['Multiply both terms by 4', '2 : 3']);
    expect(result.table?.rows.at(-1)).toEqual(['Divide both terms by 1', '2 : 3']);
    const integer = await run('simplify', {a: '18', b: '24'});
    expect(integer.table?.rows.at(-1)).toEqual(['Divide both terms by 6', '3 : 4']);
  });

  it.each([
    ['0', '0', /both quantities cannot be zero/i],
    ['0/5', '-0.0', /both quantities cannot be zero/i],
    ['1/0', '2', /zero denominator/i],
    ['1/-0', '2', /zero denominator/i],
    ['1000000000001', '2', /between/i],
    ['-2000000000001/2', '1', /between/i],
    ['1e101', '1', /exponent/i],
    ['1e-101', '1', /exponent/i],
    ['1'.repeat(121), '1', /120 characters/i],
    ['Infinity', '1', /whole number, decimal, or integer fraction/i],
    ['NaN', '1', /whole number, decimal, or integer fraction/i],
    ['1+1', '1', /whole number, decimal, or integer fraction/i],
    ['1.2/3', '1', /whole number, decimal, or integer fraction/i],
    ['1 1/2', '1', /whole number, decimal, or integer fraction/i],
  ])('rejects invalid or unsupported %s : %s', async (a, b, error) => {
    await expect(run('simplify', {a, b})).rejects.toThrow(error);
  });

  it('uses text inputs with visible guidance so browsers can accept fractions', () => {
    const mode = definition.modes.find(item => item.id === 'simplify')!;
    expect(mode.fields.map(field => field.type)).toEqual(['text', 'text']);
    expect(mode.fields[0].hint).toContain('1/2');
    expect(mode.fields[1].hint).toContain('3/4');
    expect(mode.explanation).toContain('exact arithmetic');
  });
});

describe('other ratio methods retain their validation', () => {
  it('solves each missing proportion term', async () => {
    expect((await run('solve', {a: '2', b: '3', c: '8'})).metrics[0].value).toBe(12);
    for (const [solve, expected] of [['A', 3], ['B', 4], ['C', 9], ['D', 12]] as const) {
      expect((await run('all-proportions', {solve, A: '3', B: '4', C: '9', D: '12'})).metrics[0].value).toBe(expected);
    }
  });

  it('rejects undefined and nonunique proportions', async () => {
    for (const key of ['a', 'b', 'c']) await expect(run('solve', {[key]: '0'})).rejects.toThrow(/nonzero denominator and a unique proportion/i);
    await expect(run('all-proportions', {solve: 'A', D: '0'})).rejects.toThrow(/unique valid proportion/i);
    await expect(run('all-proportions', {solve: 'A', B: '0'})).rejects.toThrow(/denominator cannot be zero/i);
  });

  it('keeps scaling and invalid factor handling unchanged', async () => {
    expect((await run('scale', {a: '3', b: '4', factor: '5', direction: 'enlarge'})).metrics[0].value).toBe('15 : 20');
    expect((await run('scale', {a: '15', b: '20', factor: '5', direction: 'shrink'})).metrics[0].value).toBe('3 : 4');
    await expect(run('scale', {factor: '0'})).rejects.toThrow(/greater than zero/i);
  });
});
