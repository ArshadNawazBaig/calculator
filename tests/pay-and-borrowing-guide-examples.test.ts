import {describe, expect, it} from 'vitest';
import {payAndBorrowingGuides, payAndBorrowingGuideCalculators} from '@/data/guides/pay-and-borrowing-guides';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults, type Result, type Values} from '@/lib/calculators/types';

async function run(slug: string, id: string, values: Values) {
  const mode = definitionMap.get(slug)!.modes.find(mode => mode.id === id)!;
  return calculate('finance', mode, {...defaults(mode), ...values});
}
const value = (result: Result, label: string) => Number(result.metrics.find(metric => metric.label === label)!.value);

describe('salary comparison guide', () => {
  it('distinguishes paid leave from unpaid leave in the two-offer comparison', async () => {
    const a = await run('salary-calculator', 'salary', {amount: '30', period: 'hour', hours: '40', days: '5', leave: '15'});
    const b = await run('salary-calculator', 'salary', {amount: '60000', period: 'year', hours: '40', days: '5', leave: '0'});
    expect(value(a, 'Annual gross pay')).toBe(62400);
    expect(value(a, 'Annual pay after unpaid leave')).toBe(58800);
    expect(value(b, 'Annual pay after unpaid leave')).toBe(60000);
    expect(value(b, 'Annual pay after unpaid leave') - value(a, 'Annual pay after unpaid leave')).toBe(1200);
    expect(value(b, 'Biweekly equivalent')).toBeCloseTo(2307.6923076923, 8);
    expect(value(b, 'Semimonthly equivalent')).toBe(2500);
  });

  it.each([['30.61', 59995.6], ['30.62', 60015.2]])('shows the rounding consequence of a %s break-even rate', async (amount, expected) => {
    const output = await run('salary-calculator', 'salary', {amount: String(amount), period: 'hour', hours: '40', days: '5', leave: '15'});
    expect(value(output, 'Annual pay after unpaid leave')).toBeCloseTo(Number(expected), 6);
  });

  it('keeps actual part-time earnings separate from full-time equivalent pay', async () => {
    const part = await run('salary-calculator', 'salary', {amount: '45000', period: 'year', hours: '30', days: '5', leave: '0'});
    const full = await run('salary-calculator', 'salary', {amount: String(value(part, 'Hourly equivalent')), period: 'hour', hours: '40', days: '5', leave: '0'});
    expect(value(part, 'Annual gross pay')).toBe(45000);
    expect(value(full, 'Annual gross pay')).toBeCloseTo(60000, 8);
    const longer = await run('salary-calculator', 'salary', {amount: '60000', period: 'year', hours: '45', days: '5', leave: '0'});
    expect(value(longer, 'Hourly equivalent')).toBeCloseTo(25.641025641, 8);
  });
});

describe('loan offer comparison guide', () => {
  it.each([
    ['10300', '6', '3', '300', 313.34595575101775, 7.996163362577136, 11280.45440703664],
    ['10000', '7', '3', '0', 308.7709686537195, 7, 11115.754871533902],
    ['10000', '7', '5', '0', 198.01198540349534, 7, 11880.719124209721],
  ] as const)('compares equal net proceeds for %s at %s%% over %s years with fee %s', async (principal, rate, years, fees, payment, nominalApr, total) => {
    const output = await run('apr-calculator', 'apr', {principal, rate, years, fees});
    const actualPayment = value(output, 'Monthly payment'), actualApr = value(output, 'Estimated nominal APR');
    expect(value(output, 'Net loan proceeds')).toBe(10000);
    expect(actualPayment).toBeCloseTo(payment, 8);
    expect(actualApr).toBeCloseTo(nominalApr, 7);
    expect(actualPayment * Number(years) * 12).toBeCloseTo(total, 6);
    // Independently discount every repayment to the same $10,000 initial cash flow.
    const present = Array.from({length: Number(years) * 12}, (_, month) => actualPayment / (1 + actualApr / 1200) ** (month + 1)).reduce((sum, amount) => sum + amount, 0);
    expect(present).toBeCloseTo(10000, 6);
  });

  it('reproduces the rounded-payment inverse example without implying fee handling', async () => {
    const mode = definitionMap.get('interest-rate-calculator')!.modes.find(mode => mode.id === 'rate')!;
    const output = await calculate('finance', mode, {...defaults(mode), principal: '10000', payment: '308.77', years: '3'});
    expect(Number(output.metrics[0].value)).toBeCloseTo(7, 3);
  });
});

it('connects both guides to real tools and supported methods', () => {
  expect(Object.keys(payAndBorrowingGuides)).toEqual(Object.keys(payAndBorrowingGuideCalculators));
  for (const [slug, guide] of Object.entries(payAndBorrowingGuides)) {
    for (const calculator of payAndBorrowingGuideCalculators[slug]) expect(definitionMap.has(calculator)).toBe(true);
    for (const section of guide.sections) for (const link of section.links || []) {
      if (!link.href.startsWith('/') || link.href === '/methodology') continue;
      const [path, fragment] = link.href.split('#'), definition = definitionMap.get(path.slice(1));
      expect(definition, link.href).toBeDefined();
      if (fragment) expect(definition!.modes.some(mode => `mode-${mode.id}` === fragment), link.href).toBe(true);
    }
  }
});
