import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {DiceFace} from '@/components/calculators/dice-controls';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults} from '@/lib/calculators/types';

const mode = definitionMap.get('dice-roller')!.modes[0];
const roll = (count: string, sides: string) => calculate('everyday', mode, {...defaults(mode), count, sides});
const pips = (html: string) => [...html.matchAll(/\bdata-pip(?:=|\s|>)/g)].length;

describe('dice faces represent the rolled value and die type', () => {
  it.each([1, 2, 3, 4, 5, 6])('draws exactly %i pips on a standard six-sided die', value => {
    const html = renderToStaticMarkup(<DiceFace sides={6} value={value}/>);
    expect(pips(html)).toBe(value);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
  });

  it.each([1, 2, 3, 4, 5, 6])('keeps a d20 roll of %i numeric rather than drawing six-sided pips', value => {
    const html = renderToStaticMarkup(<DiceFace sides={20} value={value}/>);
    expect(pips(html)).toBe(0);
    expect(html).toContain(`>${value}</text>`);
  });

  it('does not imply a rolled value for a neutral preview', () => {
    const html = renderToStaticMarkup(<DiceFace sides={6}/>);
    expect(pips(html)).toBe(0);
    expect(html).toContain('>?</text>');
  });
});

describe('visual dice data agrees with the existing result and supported input range', () => {
  it.each([[1, 2], [2, 6], [6, 20], [100, 1000]])('preserves %i dice with %i sides in the result snapshot', async (count, sides) => {
    const result = await roll(String(count), String(sides));
    expect(result.dice?.sides).toBe(sides);
    expect(result.dice?.values).toHaveLength(count);
    const values = result.dice!.values;
    for (const value of values) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(sides);
    }
    expect(result.metrics.find(metric => metric.label === 'Dice')?.value).toBe(values.join(', '));
    expect(result.metrics[0]).toMatchObject({label: 'Total', value: values.reduce((sum, value) => sum + value, 0)});
  });

  it.each([['0', '6'], ['101', '6'], ['1.5', '6'], ['', '6'], ['2', '1'], ['2', '1001'], ['2', '6.5'], ['2', '']])
    ('rejects unsupported inputs count=%s and sides=%s', async (count, sides) => {
      await expect(roll(count, sides)).rejects.toThrow();
    });
});
