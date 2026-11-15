import {describe, expect, it} from 'vitest';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';

const mode = definitionMap.get('age-calculator')!.modes[0];
async function age(birth: string, asof: string) {
  const result = await calculate('everyday', mode, {birth, asof});
  return {result, values: Object.fromEntries(result.metrics.map(metric => [metric.label, metric.value]))};
}

describe('age calculator worked examples and calendar conventions', () => {
  it('reconciles the worked calendar age, complete months, weeks and birthday countdown', async () => {
    const {result, values} = await age('1998-09-23', '2026-06-15');
    expect(result.metrics.slice(0, 2).map(metric => metric.label)).toEqual(['Calendar age', 'Total days']);
    expect(values).toEqual({
      'Calendar age': '27 years, 8 months, 23 days',
      'Total days': 10127,
      'Completed calendar months': 332,
      'Complete weeks': 1446,
      'Days after complete weeks': 5,
      'Next birthday': '2026-09-23',
      'Days until next birthday': 100,
    });
    expect(Number(values['Complete weeks']) * 7 + Number(values['Days after complete weeks'])).toBe(values['Total days']);
  });

  it('uses singular units for exactly one year, month or day', async () => {
    expect((await age('2025-01-15', '2026-02-16')).values['Calendar age']).toBe('1 year, 1 month, 1 day');
  });

  it.each([
    ['2026-06-14', '25 years, 11 months, 30 days', 9495, '2026-06-15', 1],
    ['2026-06-15', '26 years, 0 months, 0 days', 9496, '2026-06-15', 0],
    ['2026-06-16', '26 years, 0 months, 1 day', 9497, '2027-06-15', 364],
  ])('crosses the birthday boundary on %s', async (asof, calendar, days, birthday, countdown) => {
    const {values} = await age('2000-06-15', asof);
    expect(values['Calendar age']).toBe(calendar);
    expect(values['Total days']).toBe(days);
    expect(values['Next birthday']).toBe(birthday);
    expect(values['Days until next birthday']).toBe(countdown);
  });

  it.each([
    ['2025-02-28', '0 years, 1 month, 0 days', 28, 1],
    ['2025-03-30', '0 years, 1 month, 30 days', 58, 1],
    ['2025-03-31', '0 years, 2 months, 0 days', 59, 2],
  ])('anchors month ends to January 31 for %s', async (asof, calendar, days, months) => {
    const {values} = await age('2025-01-31', asof);
    expect(values['Calendar age']).toBe(calendar);
    expect(values['Total days']).toBe(days);
    expect(values['Completed calendar months']).toBe(months);
  });

  it.each([
    ['2025-02-27', '0 years, 11 months, 29 days', '2025-02-28', 1],
    ['2025-02-28', '1 year, 0 months, 0 days', '2025-02-28', 0],
    ['2025-03-01', '1 year, 0 months, 1 day', '2026-02-28', 364],
    ['2028-02-28', '3 years, 11 months, 30 days', '2028-02-29', 1],
    ['2028-02-29', '4 years, 0 months, 0 days', '2028-02-29', 0],
  ])('uses the explicit leap-day anniversary rule on %s', async (asof, calendar, birthday, countdown) => {
    const {values} = await age('2024-02-29', asof);
    expect(values['Calendar age']).toBe(calendar);
    expect(values['Next birthday']).toBe(birthday);
    expect(values['Days until next birthday']).toBe(countdown);
  });

  it('distinguishes the 2000 leap century from the common year 2100', async () => {
    expect((await age('2000-02-28', '2000-03-01')).values['Total days']).toBe(2);
    expect((await age('2100-02-28', '2100-03-01')).values['Total days']).toBe(1);
    const {values} = await age('2000-02-29', '2100-02-28');
    expect(values['Calendar age']).toBe('100 years, 0 months, 0 days');
    expect(values['Total days']).toBe(36524);
    expect(values['Next birthday']).toBe('2100-02-28');
  });

  it('keeps years 0001 and 0099 literal when constructing anniversaries', async () => {
    const first = await age('0001-06-15', '0001-06-15');
    expect(first.values['Total days']).toBe(0);
    expect(first.values['Calendar age']).toBe('0 years, 0 months, 0 days');
    expect(first.values['Next birthday']).toBe('0001-06-15');
    const later = await age('0001-06-15', '0099-06-14');
    expect(later.values['Calendar age']).toBe('97 years, 11 months, 30 days');
    expect(later.values['Total days']).toBe(35793);
    expect(later.values['Next birthday']).toBe('0099-06-15');
    expect(later.values['Days until next birthday']).toBe(1);
  });

  it('returns the valid age when the next anniversary would exceed year 9999', async () => {
    const {result, values} = await age('9999-01-01', '9999-12-31');
    expect(values['Calendar age']).toBe('0 years, 11 months, 30 days');
    expect(values['Total days']).toBe(364);
    expect(values).not.toHaveProperty('Next birthday');
    expect(values).not.toHaveProperty('Days until next birthday');
    expect(result.notes?.join(' ')).toContain('beyond the supported year 9999');
    expect((await age('9999-12-31', '9999-12-31')).values['Next birthday']).toBe('9999-12-31');
  });

  it.each([
    ['2026-06-16', '2026-06-15'],
    ['2025-02-29', '2026-06-15'],
    ['2000-02-29', '2100-02-29'],
    ['0000-01-01', '2026-06-15'],
    ['1998-09-23', '2026-06-15T12:00:00Z'],
  ])('rejects reversed, invalid or out-of-scope input %s → %s', async (birth, asof) => {
    await expect(age(birth, asof)).rejects.toThrow();
  });
});
