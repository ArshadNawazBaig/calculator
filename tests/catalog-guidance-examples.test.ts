import {describe, expect, it} from 'vitest';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap, toolMap} from '@/lib/calculators/registry';
import examples from './fixtures/catalog-guidance-examples.json';

// Independently worked article examples, with their inputs frozen so a change to
// form defaults cannot silently change the example being verified.
type Example = {
  slug: string;
  modeId: string;
  inputs: Record<string, string>;
  expected: {label: string; value: number | string; tolerance?: number}[];
  expectedTableRows?: (string | number)[][];
};

describe('published calculator guidance examples', () => {
  for (const [index, example] of (examples as unknown as Example[]).entries()) {
    it(`${example.slug} / ${example.modeId} / example ${index + 1}`, async () => {
      const definition = definitionMap.get(example.slug)!;
      const mode = definition.modes.find(item => item.id === example.modeId)!;
      expect(mode).toBeDefined();
      expect(Object.values(example.inputs).every(value => typeof value === 'string')).toBe(true);
      const output = await calculate(toolMap.get(example.slug)!.category, mode, example.inputs);
      for (const expected of example.expected) {
        const actual = output.metrics.find(metric => metric.label === expected.label);
        expect(actual, expected.label).toBeDefined();
        if (typeof expected.value === 'number') {
          expect(typeof actual!.value, expected.label).toBe('number');
          expect(Math.abs(Number(actual!.value) - expected.value), expected.label)
            .toBeLessThanOrEqual(expected.tolerance ?? 1e-7);
        } else {
          expect(actual!.value, expected.label).toBe(expected.value);
        }
      }
      if (example.expectedTableRows) expect(output.table?.rows).toEqual(example.expectedTableRows);
    });
  }
});
