import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {MaterialMeasurementDiagram, materialMeasurement} from '@/components/calculators/material-measurement-diagram';
import {definitionMap} from '@/lib/calculators/registry';
import {calculate} from '@/lib/calculators/engine';
import {defaults, type Values} from '@/lib/calculators/types';

function props(slug: string, id: string, values: Values = {}) {
  const mode = definitionMap.get(slug)!.modes.find(mode => mode.id === id)!;
  return {slug, mode, values: {...defaults(mode), ...values}};
}

describe('material guides follow actual selected measurements', () => {
  it('uses floor diameter for a circle and radius for a sector', () => {
    const circle = materialMeasurement(props('square-footage-calculator', 'measured', {shape: 'circle'}))!;
    const sector = materialMeasurement(props('square-footage-calculator', 'measured', {shape: 'sector'}))!;
    expect(circle.description).toContain('diameter');
    expect(circle.formula).toContain('(d / 2)²');
    expect(sector.description).toContain('radius');
    expect(sector.formula).toContain('r²');
  });

  it('changes concrete diagrams within mixed-unit mode and does not draw unsupported stairs or curbs', () => {
    for (const shape of ['slab', 'column', 'tube']) {
      const input = props('concrete-calculator', 'measured', {shape});
      expect(materialMeasurement(input)?.shape).toBe(shape);
      const html = renderToStaticMarkup(<MaterialMeasurementDiagram {...input}/>);
      expect(html).toMatch(/<img\b[^>]*src="\/illustrations\/material\/[^"\s]+\.webp"/);
      expect(html).toContain(`alt="${materialMeasurement(input)!.description}"`);
      expect(html).not.toContain('<svg');
    }
    for (const shape of ['stairs', 'curb']) {
      expect(renderToStaticMarkup(<MaterialMeasurementDiagram {...props('concrete-calculator', 'measured', {shape})}/>)).toBe('');
    }
    expect(renderToStaticMarkup(<MaterialMeasurementDiagram {...props('concrete-calculator', 'measured', {shape: 'curb'})} fallback={<p>Text guidance</p>}/>)).toBe('<p>Text guidance</p>');
  });

  it('does not imply one rectangle for a list of beds or a known-area input', () => {
    for (const shape of ['beds', 'known-area']) expect(materialMeasurement(props('mulch-calculator', 'purchasing', {shape}))).toBeUndefined();
    expect(materialMeasurement(props('mulch-calculator', 'purchasing', {shape: 'circle'}))?.shape).toBe('column');
    expect(materialMeasurement(props('tile-calculator', 'procurement', {areaInput: 'known-area'}))).toBeUndefined();
  });

  it('distinguishes roof angle from rise per twelve and limits stairs to standard layouts', () => {
    expect(materialMeasurement(props('roofing-calculator', 'area-angle', {slopeInput: 'degrees'}))?.formula).toContain('cos(θ)');
    expect(materialMeasurement(props('roofing-calculator', 'area-angle', {slopeInput: 'rise-per12'}))?.formula).toContain('p / 12');
    expect(materialMeasurement(props('stair-calculator', 'layout'))).toBeUndefined();
  });
});

describe('published material examples match actual calculators', () => {
  const examples: [string, string, Values, string, number][] = [
    ['concrete-calculator', 'slab', {}, 'Net concrete', 2.469135802469136],
    ['concrete-calculator', 'slab', {}, 'With allowance', 2.71604938271605],
    ['mulch-calculator', 'bed', {}, 'Volume', 50 / 27],
    ['gravel-calculator', 'circle', {}, 'Bags required', 41],
    ['roofing-calculator', 'roof', {}, 'Roof surface', 1341.640786499874],
    ['stair-calculator', 'stairs', {}, 'Risers', 14],
    ['stair-calculator', 'stairs', {}, 'Total run', 130],
    ['tile-calculator', 'tiles', {}, 'Tiles required', 132],
    ['square-footage-calculator', 'measured', {shape: 'rectangle', length: '3', lengthUnit: 'ft', width: '24', widthUnit: 'in', price: '2.5', priceAreaUnit: 'ft2'}, 'Estimated area cost', 15],
  ];
  it.each(examples)('%s %s: %s → %s', async (slug, id, values, label, expected) => {
    const input = props(slug, id, values);
    const result = await calculate('everyday', input.mode, input.values);
    expect(result.metrics.find(metric => metric.label === label)?.value).toBeCloseTo(expected, 10);
  });
});
