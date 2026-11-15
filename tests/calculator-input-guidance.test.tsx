import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {InputGuide} from '@/components/calculators/input-guide';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults} from '@/lib/calculators/types';
import {displayField} from '@/lib/calculators/input-display';

describe('calculator task and measurement clarity', () => {
  it('puts standard deviation first while preserving the average calculator result', async () => {
    const mode = definitionMap.get('standard-deviation-calculator')!.modes[0];
    const result = await calculate('math', mode, {data: '2,4,4,4,5,5,7,9'});
    expect(result.metrics[0].label).toBe('Sample standard deviation');
    expect(result.metrics[0].value).toBeCloseTo(Math.sqrt(32 / 7), 12);
    expect(result.metrics[1]).toMatchObject({label: 'Population standard deviation', value: 2});
    const average = await calculate('math', definitionMap.get('average-calculator')!.modes[0], {data: '2,4,4,4,5,5,7,9'});
    expect(average.metrics[0]).toMatchObject({label: 'Mean', value: 5});
    const single = await calculate('math', mode, {data: '5'});
    expect(single.metrics[0]).toMatchObject({label: 'Population standard deviation', value: 0});
    expect(single.metrics.some(metric => metric.label === 'Sample standard deviation')).toBe(false);
  });

  it('distinguishes inverse normal probabilities from z scores and validates their scales', async () => {
    const mode = definitionMap.get('z-score-calculator')!.modes.find(mode => mode.algorithm === 'normal-tails')!;
    const field = mode.fields.find(field => field.key === 'value')!;
    const z = displayField(mode, field, {...defaults(mode), known: 'z'});
    const probability = displayField(mode, field, {...defaults(mode), known: 'left'});
    expect(z.label).toBe('Z-score');
    expect(probability.label).toBe('Probability below');
    expect(probability.unit).toBe('0–1');
    const result = await calculate('math', mode, {...defaults(mode), known: 'left', value: '0.975'});
    expect(Number(result.metrics[0].value)).toBeCloseTo(1.9599639845, 8);
    await expect(calculate('math', mode, {...defaults(mode), known: 'left', value: '97.5'})).rejects.toThrow();
  });

  it('renders method-specific instructions and notes before scripts run', () => {
    const mode = definitionMap.get('simple-interest-calculator')!.modes[0];
    const html = renderToStaticMarkup(<InputGuide mode={mode}/>);
    expect(html).toContain('<details');
    expect(html).toContain('<summary>Formula and input guidance</summary>');
    expect(html).toContain(mode.explanation.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;'));
    expect(html).not.toContain(' open=');
  });

  it('labels perpendicular height and its unit together when a floor shape changes', async () => {
    const mode = definitionMap.get('square-footage-calculator')!.modes.find(mode => mode.id === 'measured')!;
    const values = {...defaults(mode), shape: 'base-height', length: '8', width: '3'};
    expect(displayField(mode, mode.fields.find(field => field.key === 'width')!, values).label).toBe('Perpendicular height');
    expect(displayField(mode, mode.fields.find(field => field.key === 'widthUnit')!, values).label).toBe('Perpendicular height unit');
    const result = await calculate('everyday', mode, values);
    expect(result.metrics[0].value).toBeCloseTo(12, 10);
  });
});
