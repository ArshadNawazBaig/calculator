import {describe, expect, it} from 'vitest';
import {elapsedTimeGuides} from '@/data/guides/elapsed-time-guide';
import {definitionMap, catalog} from '@/lib/calculators/registry';
import {calculate} from '@/lib/calculators/engine';
import {defaults, type Values} from '@/lib/calculators/types';

async function metrics(slug: string, id: string, inputs: Values) {
  const mode = definitionMap.get(slug)!.modes.find(mode => mode.id === id)!;
  const result = await calculate(catalog.find(tool => tool.slug === slug)!.category, mode, {...defaults(mode), ...inputs});
  return Object.fromEntries(result.metrics.map(metric => [metric.label, metric.value]));
}

describe('elapsed-time guide worked examples', () => {
  it.each([
    ['08:45', '17:15', '45', '07:45:00', 7.75],
    ['09:10', '17:40', '30', '08:00:00', 8],
    ['22:15', '06:45', '30', '08:00:00', 8],
    ['09:00', '18:20', '50', '08:30:00', 8.5],
    ['09:00', '16:15', '45', '06:30:00', 6.5],
  ])('subtracts the break from %s to %s', async (start, end, excluded, duration, decimal) => {
    const result = await metrics('time-duration-calculator', 'duration', {start, end, break: excluded});
    expect(result['Elapsed time']).toBe(duration);
    expect(result['Decimal hours']).toBe(decimal);
  });

  it('reconciles all five dated shifts with the independently totaled 2,325 minutes', async () => {
    const shifts = [
      {workDate: '2026-11-02', start: '08:45', end: '17:15', breakMinutes: 45},
      {workDate: '2026-11-03', start: '09:10', end: '17:40', breakMinutes: 30},
      {workDate: '2026-11-04', start: '22:15', end: '06:45', breakMinutes: 30},
      {workDate: '2026-11-05', start: '09:00', end: '18:20', breakMinutes: 50},
      {workDate: '2026-11-06', start: '09:00', end: '16:15', breakMinutes: 45},
    ];
    const result = await metrics('time-card-calculator', 'dated-shifts', {
      shifts: JSON.stringify(shifts), roundMinutes: '0', overtimeMode: 'none', rate: '0',
    });
    expect(result['Raw hours']).toBe(38.75);
    expect(result['Total hours']).toBe(38.75);
    expect(result['Overtime hours']).toBe(0);
  });

  it('adds already net durations without subtracting breaks twice', async () => {
    const result = await metrics('time-calculator', 'expression', {
      expression: '7h 45m + 8h + 8h + 8h 30m + 6h 30m',
    });
    expect(result['Total seconds']).toBe(139500);
    expect(result['Decimal hours']).toBe(38.75);
  });

  it('preserves the difference between minutes and the decimal part of an hour', async () => {
    const clockNotation = await metrics('time-calculator', 'arithmetic', {a: '7:45:00', operation: '+', b: '0:00:00'});
    const decimalNotation = await metrics('time-calculator', 'expression', {expression: '7.45h'});
    expect(clockNotation['Seconds']).toBe(27900);
    expect(clockNotation['Decimal hours']).toBe(7.75);
    expect(decimalNotation['Total seconds']).toBe(26820);
  });

  it('reproduces the 36-second loss caused by rounding three intervals early', async () => {
    const exact = await metrics('time-calculator', 'expression', {expression: '20m + 20m + 20m'});
    const rounded = await metrics('time-calculator', 'expression', {expression: '0.33h + 0.33h + 0.33h'});
    expect(exact['Total seconds']).toBe(3600);
    expect(rounded['Total seconds']).toBe(3564);
  });

  it.each([
    ['2h 30m + 25m', 10500],
    ['2h 30m + 30m', 10800],
  ])('counts breaks inside the endpoint of %s', async (expression, seconds) => {
    const result = await metrics('time-calculator', 'expression', {expression});
    expect(result['Total seconds']).toBe(seconds);
  });

  it('uses dates for a 49.5-hour span and does not infer a day from equal clock readings', async () => {
    const dated = await metrics('time-duration-calculator', 'dated', {
      start: '2026-11-02', startTime: '09:00', end: '2026-11-04', endTime: '10:30',
    });
    const clockOnly = await metrics('time-duration-calculator', 'duration', {start: '09:00', end: '09:00', break: '0'});
    expect(dated['Elapsed hours']).toBe(49.5);
    expect(clockOnly['Decimal hours']).toBe(0);
  });

  it('distinguishes the New York spring clock difference from UTC elapsed time', async () => {
    const common = {date: '2026-03-08', from: 'America/New_York', to: 'UTC'};
    const start = await metrics('time-zone-calculator', 'zone', {...common, time: '01:30'});
    const end = await metrics('time-zone-calculator', 'zone', {...common, time: '03:30'});
    expect(start['UTC instant']).toBe('2026-03-08T06:30:00.000Z');
    expect(end['UTC instant']).toBe('2026-03-08T07:30:00.000Z');
    expect(start['Source offset minutes']).toBe(-300);
    expect(end['Source offset minutes']).toBe(-240);

    const civil = await metrics('time-duration-calculator', 'dated', {
      start: '2026-03-08', startTime: '01:30', end: '2026-03-08', endTime: '03:30',
    });
    const utc = await metrics('time-duration-calculator', 'dated', {
      start: '2026-03-08', startTime: '06:30', end: '2026-03-08', endTime: '07:30',
    });
    expect(civil['Elapsed hours']).toBe(2);
    expect(utc['Elapsed hours']).toBe(1);
  });

  it('links every calculator instruction to an existing input mode', () => {
    const guide = elapsedTimeGuides['elapsed-time-breaks-and-decimal-hours'];
    const internalLinks = guide.sections.flatMap(section => section.links ?? []).filter(link => link.href.startsWith('/'));
    expect(internalLinks.length).toBeGreaterThan(0);
    for (const link of internalLinks) {
      const [path, mode] = link.href.split('#mode-');
      const definition = definitionMap.get(path.slice(1));
      expect(definition, link.href).toBeDefined();
      expect(definition!.modes.some(item => item.id === mode), link.href).toBe(true);
    }
  });
});
