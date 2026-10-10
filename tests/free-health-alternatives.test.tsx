import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {runTalkTest} from '@/lib/calculators/talk-test';
import {formatMetric} from '@/lib/calculators/format-metric';
import {CalculatorResult} from '@/components/calculators/result';
import {LanguageProvider} from '@/components/i18n/provider';

const mode = definitionMap.get('target-heart-rate-calculator')!.modes.find(m => m.id === 'talk-test')!;

describe('CDC talk-test alternative', () => {
  it.each([
    ['conversation', 'Moderate relative intensity'],
    ['few-words', 'Vigorous relative intensity'],
    ['unsure', 'Not classified'],
  ])('reports the published speech pattern for %s without inventing a pulse', async (speech, expected) => {
    const result = await calculate('health', mode, {speech});
    expect(result.metrics[0].value).toBe(expected);
    expect(result.metrics.some(m => m.unit === 'beats/min' || typeof m.value === 'number')).toBe(false);
    expect(result.notes?.join(' ')).toContain('Source: CDC.');
    if (speech === 'unsure') expect(result.notes?.join(' ')).toContain('does not establish an intensity level');
  });
  it('rejects unknown responses through dispatch and direct evaluation', async () => {
    await expect(calculate('health', mode, {speech: 'unknown'})).rejects.toThrow();
    expect(() => runTalkTest({speech: 'constructor'})).toThrow('Choose a supported talk-test response.');
  });
});

describe('translation of application-owned results', () => {
  const source = 'Moderate relative intensity', translated = 'Intensidad relativa moderada';
  const translate = (s: string) => s === source ? translated : s;
  it('translates explicitly marked labels while preserving identical user strings', () => {
    expect(formatMetric({label: 'Result', value: source, translateValue: true}, 'USD', 'es', translate)).toBe(translated);
    expect(formatMetric({label: 'Result', value: source}, 'USD', 'es', translate)).toBe(source);
    expect(formatMetric({label: 'Result', value: source, translateValue: false}, 'USD', 'es', translate)).toBe(source);
    expect(formatMetric({label: 'Result', value: 12.5, translateValue: true}, 'USD', 'es', translate)).toBe('12,5');
  });
  it('renders the translated indication and preserves unmarked text', () => {
    const html = renderToStaticMarkup(<LanguageProvider locale="es" messages={{[source]: translated}}><CalculatorResult result={{metrics: [{label: 'Indication', value: source, translateValue: true}, {label: 'User text', value: source}]}}/></LanguageProvider>);
    expect(html).toContain(`<dd>${translated}</dd>`);
    expect(html).toContain(`<dd>${source}</dd>`);
  });
});
