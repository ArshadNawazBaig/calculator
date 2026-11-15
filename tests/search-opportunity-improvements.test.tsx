import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults} from '@/lib/calculators/types';
import {CalculatorGuidance} from '@/components/content/calculator-guidance';
import content from '@/data/calculator-content.json';

describe('salary conversion and search-page examples', () => {
  it.each([
    ['salary', {amount: '25', period: 'hour', hours: '40', days: '5', leave: '10'}],
    ['salary', {amount: '52000', period: 'year', hours: '40', days: '5', leave: '10'}],
    ['schedule-units', {salaryAmount: '25', salaryPeriod: 'hourly', hoursPerDay: '8', daysPerWeek: '5', holidays: '0', vacationDays: '10'}],
    ['schedule-units', {salaryAmount: '13000', salaryPeriod: 'quarterly', hoursPerDay: '8', daysPerWeek: '5', holidays: '0', vacationDays: '10'}],
  ] as const)('compares every pay period in %s without mixing the unpaid-leave scenario into gross pay', async (id, inputs) => {
    const mode = definitionMap.get('salary-calculator')!.modes.find(mode => mode.id === id)!;
    const result = await calculate('finance', mode, {...defaults(mode), ...inputs});
    const rows = Object.fromEntries(result.table!.rows.map(row => [row[0], row[1]]));
    expect(rows).toMatchObject({Hourly: 25, Daily: 200, Weekly: 1000, 'Biweekly (26 per year)': 2000, Quarterly: 13000, Annual: 52000});
    expect(rows['Semimonthly (24 per year)']).toBeCloseTo(2166.6666667, 5);
    expect(rows.Monthly).toBeCloseTo(4333.3333333, 5);
    const adjustedLabel = id === 'salary' ? 'Annual pay after unpaid leave' : 'Adjusted annual earnings';
    expect(result.metrics.find(metric => metric.label === adjustedLabel)?.value).toBe(50000);
  });

  it('uses the entered part-time schedule for hourly and daily equivalents', async () => {
    const mode = definitionMap.get('salary-calculator')!.modes[0];
    const result = await calculate('finance', mode, {...defaults(mode), amount: '26000', period: 'year', hours: '20', days: '4'});
    const rows = Object.fromEntries(result.table!.rows.map(row => [row[0], row[1]]));
    expect(rows.Hourly).toBe(25);
    expect(rows.Daily).toBe(125);
    expect(rows.Weekly).toBe(500);
  });

  it('checks the new calendar examples against calendar arithmetic', async () => {
    const definition = definitionMap.get('date-calculator')!;
    const mode = definition.modes.find(mode => mode.id === 'add')!;
    const month = await calculate('everyday', mode, {...defaults(mode), start: '2026-01-31', years: '0', months: '1', weeks: '0', days: '0'});
    const week = await calculate('everyday', mode, {...defaults(mode), start: '2026-03-01', years: '0', months: '0', weeks: '0', days: '-7'});
    expect(month.metrics.some(metric => metric.value === '2026-02-28')).toBe(true);
    expect(week.metrics.some(metric => metric.value === '2026-02-22')).toBe(true);
  });

  it('reproduces the published loan-fee example and equivalent net cash flows', async () => {
    const mode = definitionMap.get('apr-calculator')!.modes.find(mode => mode.id === 'apr')!;
    const values = {...defaults(mode), principal: '10000', rate: '6', years: '3', fees: '300'};
    const result = await calculate('finance', mode, values);
    const rate = Number(result.metrics.find(metric => metric.label === 'Estimated nominal APR')!.value);
    const payment = Number(result.metrics.find(metric => metric.label === 'Monthly payment')!.value);
    expect(payment).toBeCloseTo(304.2193745, 6);
    expect(rate).toBeCloseTo(8.0573353, 5);
    // Independent discounted cash-flow check, rather than the engine's root solver.
    const received = Array.from({length: 36}, (_, month) => payment / (1 + rate / 1200) ** (month + 1)).reduce((sum, present) => sum + present, 0);
    expect(received).toBeCloseTo(9700, 6);
  });

  it('renders crawlable comparison tables and links to actual calculator methods', () => {
    for (const slug of ['salary-calculator', 'height-calculator', 'date-calculator', 'apr-calculator', 'rounding-calculator', 'scientific-notation-calculator', 'time-duration-calculator'] as const) {
      const html = renderToStaticMarkup(<CalculatorGuidance slug={slug}/>);
      expect(html).toContain('<caption>');
      expect(html).toContain('scope="row"');
      const sections = content[slug].sections as {links?: {href: string}[]}[];
      for (const section of sections) for (const link of section.links || []) {
        const [path, fragment] = link.href.split('#');
        const target = definitionMap.get(path ? path.slice(1) : slug);
        expect(target, link.href).toBeDefined();
        if (fragment) expect(target!.modes.some(mode => `mode-${mode.id}` === fragment), link.href).toBe(true);
        expect(html).toContain(`href="${link.href}"`);
      }
    }
  });
});
