import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {isValidElement, type ReactNode} from 'react';
import EnglishToolPage from '@/app/(en)/[slug]/page';
import {AdultBmiScreening} from '@/components/content/adult-bmi-screening';
import {CalculatorArticle} from '@/components/i18n/calculator-article';
import {calculate} from '@/lib/calculators/engine';
import {formatMetric} from '@/lib/calculators/format-metric';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults} from '@/lib/calculators/types';

describe('adult BMI screening interpretation', () => {
  // Independent Decimal evaluations of weight / 1.75². CDC category boundaries:
  // https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html
  it.each([
    ['56.65', 18.49795918367347, 'Underweight', '18.5 kg/m²'],
    ['56.65625', 18.5, 'Healthy-weight range', '18.5 kg/m²'],
    ['76.56', 24.99918367346939, 'Healthy-weight range', '25 kg/m²'],
    ['76.5625', 25, 'Overweight', '25 kg/m²'],
    ['91.87', 29.99836734693877, 'Overweight', '30 kg/m²'],
    ['91.875', 30, 'Obesity range', '30 kg/m²'],
  ])('preserves the unrounded category at %s kg', async (weight, bmi, category, displayed) => {
    for (const slug of ['overweight-calculator', 'bmi-calculator']) {
      const mode = definitionMap.get(slug)!.modes.find(mode => mode.id === 'adult')!;
      const result = await calculate('health', mode, {...defaults(mode), units: 'metric', age: '30', height: '175', weight});
      expect(result.metrics[0].value).toBeCloseTo(Number(bmi), 11);
      expect(result.metrics[1].value).toBe(category);
      expect(formatMetric(result.metrics[0])).toBe(displayed);
      expect(result.notes?.join(' ')).toContain('before display rounding');
    }
  });

  it('keeps adult input validation separate from the linked child percentile mode', async () => {
    const mode = definitionMap.get('overweight-calculator')!.modes[0];
    await expect(calculate('health', mode, {...defaults(mode), age: '19'})).rejects.toThrow('at least 20');
    const child = definitionMap.get('bmi-calculator')!.modes.find(mode => mode.id === 'child')!;
    expect(child.algorithm).toBe('bmi-child');
    const result = await calculate('health', child, defaults(child));
    expect(result.metrics.some(metric => metric.label === 'BMI-for-age percentile')).toBe(true);
  });

  it('renders the distinct workflow, accessible tables and real age-specific mode links', () => {
    const html = renderToStaticMarkup(<AdultBmiScreening/>);
    expect(html.match(/<caption>/g)).toHaveLength(2);
    expect(html.match(/scope="row"/g)).toHaveLength(6);
    expect(html).toContain('href="#mode-adult"');
    expect(html).toContain('href="/bmi-calculator#mode-child"');
    expect(html).toContain('not recommended weights');
    expect(html).toContain('24.999183…');
    expect(html).toContain('www.cdc.gov/bmi/adult-calculator/bmi-categories.html');
    expect(html).toContain('www.cdc.gov/bmi/child-teen-calculator/bmi-categories.html');
  });

  it('publishes this workflow on the interpretation page without duplicating it across BMI tools', () => {
    for (const slug of ['overweight-calculator', 'bmi-calculator']) {
      const html = renderToStaticMarkup(<CalculatorArticle definition={definitionMap.get(slug)!} initial={null} currency="USD" messages={{}} locale="en"/>);
      expect(html.includes('id="adult-screening-guide"')).toBe(slug === 'overweight-calculator');
    }
  });

  it('includes the workflow in the actual published English route', async () => {
    function screeningSections(node: ReactNode): number {
      if (Array.isArray(node)) return node.reduce<number>((count, child) => count + screeningSections(child), 0);
      if (!isValidElement<{children?: ReactNode}>(node)) return 0;
      return Number(node.type === AdultBmiScreening) + screeningSections(node.props.children);
    }
    // The English route has its own article template, separate from the
    // localized CalculatorArticle. Exercise its returned server-component tree.
    for (const slug of ['overweight-calculator', 'bmi-calculator']) {
      const page = await EnglishToolPage({params: Promise.resolve({slug})});
      expect(screeningSections(page)).toBe(slug === 'overweight-calculator' ? 1 : 0);
    }
  });
});
