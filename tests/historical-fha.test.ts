import {describe, expect, it} from 'vitest';
import {historicalFhaNormalization, historicalFhaRegime, historicalFhaRequest, historicalFhaProjection, runHistoricalFha} from '@/lib/calculators/historical-fha';
import {runProgramComposition} from '@/lib/calculators/program-composition';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults, type Mode, type Result, type Values} from '@/lib/calculators/types';
import references from './fixtures/historical-fha-reference.json';
import projections from './fixtures/historical-fha-projection-reference.json';

type Fixture = {id: string; function: string; input: Record<string, unknown>; expected: Record<string, unknown>; absoluteTolerance: number};
type ProjectionFixture = {id: string; input: Record<string, unknown>; expectedMetrics: Record<string, number | string>; expectedRows: {month: number; monthlyMIP: number; acceleratedMIP: number}[]; absoluteTolerance: number};
const inputs = (input: Record<string, unknown>): Values => Object.fromEntries(Object.entries(input).map(([key, value]) => [key, typeof value === 'boolean' ? value ? 'yes' : 'no' : typeof value === 'object' ? JSON.stringify(value) : String(value)]));
const metric = (result: Result, label: string) => result.metrics.find(value => value.label === label)?.value;
const base = {...references.fixtures.find(value => value.id === 'hud-financed-upfront-78-exact')!.input};
function compare(actual: unknown, expected: unknown, tolerance: number, path = 'result') {
  if (expected !== null && typeof expected === 'object') {
    expect(actual, path).not.toBeNull();
    expect(typeof actual, path).toBe('object');
    for (const [key, value] of Object.entries(expected)) compare((actual as Record<string, unknown>)[key], value, tolerance, `${path}.${key}`);
  } else if (typeof expected === 'number') {
    expect(typeof actual, path).toBe('number');
    expect(Number.isFinite(actual), path).toBe(true);
    expect(Math.abs(Number(actual) - expected), `${path}: expected ${expected}, received ${actual}`).toBeLessThanOrEqual(tolerance);
  } else expect(actual, path).toEqual(expected);
}
function modeFor(algorithm: string): Mode {
  const mode = definitionMap.get('fha-loan-calculator')?.modes.find(value => value.algorithm === algorithm);
  if (!mode) throw Error(`Missing FHA mode ${algorithm}`);
  return mode;
}

describe('Independent HUD historical 78% reference fixtures', () => {
  const helpers = {normalization: historicalFhaNormalization, regime: historicalFhaRegime, request: historicalFhaRequest};
  for (const fixture of references.fixtures as unknown as Fixture[]) {
    it(fixture.id, () => compare(helpers[fixture.function as keyof typeof helpers](fixture.input), fixture.expected, fixture.absoluteTolerance));
  }

  it('accepts the public yes/no controls without treating no as truthy', () => {
    const result = historicalFhaRequest({...inputs(base), servicerCancellationConfirmed: 'no', over30DaysLateInPast12Months: 'no'});
    expect(result.eligibleToRequest).toBe(true);
    expect(result.cancellationProcessed).toBe(false);
    expect(historicalFhaRequest({...inputs(base), over30DaysLateInPast12Months: 'yes'}).eligibleToRequest).toBe(false);
  });

  it('does not let a claimed approval override incomplete minimum months', () => {
    const result = historicalFhaRequest({...base, paidMipMonths: 59, servicerCancellationConfirmed: true});
    expect(result.eligibleToRequest).toBe(false);
    expect(result.cancellationProcessed).toBe(false);
  });

  it('rejects invalid chronology and unsupported fractional terms', () => {
    expect(() => historicalFhaRegime({...base, caseAssignedDate: '2012-03-21'})).toThrow(/cannot follow/i);
    expect(() => historicalFhaRegime({...base, termMonths: 180.5})).toThrow();
    expect(() => historicalFhaRegime({...base, closingDate: '2012-02-30'})).toThrow();
  });

  it('requires positive original values and nonnegative finite balances', () => {
    for (const key of ['baseLoan', 'originalPrice', 'originalAppraisal']) expect(() => historicalFhaNormalization({...base, [key]: 0})).toThrow(/positive/i);
    expect(() => historicalFhaNormalization({...base, noteBalance: -1})).toThrow();
    expect(() => historicalFhaNormalization({...base, financedUpfrontAmount: Infinity})).toThrow();
    expect(() => historicalFhaRequest({...base, paidMipMonths: 59.5})).toThrow();
  });
});

describe('Historical projection boundary and scope checks', () => {
  it('preserves the exact financed-premium threshold rather than rounded LTV', () => {
    expect(historicalFhaProjection(base, [{month: 60, ending: 79365.01}, {month: 61, ending: 79365}])).toBe(61);
  });

  it('applies the long-term minimum after an early threshold crossing', () => {
    expect(historicalFhaProjection(base, [{month: 50, ending: 79365}])).toBe(60);
    expect(historicalFhaProjection({...base, termMonths: 180}, [{month: 50, ending: 79365}])).toBe(50);
  });

  it('retains the five-year floor when the longer loan starts below 78%', () => {
    expect(historicalFhaProjection({...base, baseLoan: 70000, financedUpfrontAmount: 1225}, [])).toBe(60);
  });

  it('returns zero for a vintage exempt from annual MIP', () => {
    expect(historicalFhaProjection({...base, termMonths: 180, baseLoan: 78000}, [])).toBe(0);
  });

  it('reports a threshold not reached without inventing a cancellation month', () => {
    expect(historicalFhaProjection(base, [{month: 60, ending: 80000}])).toBeNull();
  });

  it('rejects modern, unverified and pre-2001 scenarios in the historical projector', () => {
    expect(() => historicalFhaProjection({...base, closingDate: '2013-07-01', caseAssignedDate: '2013-06-03'}, [])).toThrow(/eligible historical/i);
    expect(() => historicalFhaProjection({...base, verifiedEligibleMMI: false}, [])).toThrow(/eligible historical/i);
    expect(() => historicalFhaProjection({...base, closingDate: '2000-12-31', caseAssignedDate: '2000-12-01'}, [])).toThrow(/eligible historical/i);
  });
});

describe('Independent historical FHA composition fixtures', () => {
  for (const fixture of projections.fixtures as unknown as ProjectionFixture[]) {
    it(fixture.id, () => {
      const result = runProgramComposition(inputs(fixture.input));
      for (const [label, expected] of Object.entries(fixture.expectedMetrics)) compare(metric(result, label), expected, fixture.absoluteTolerance, label);
      for (const expected of fixture.expectedRows) {
        const row = result.table?.rows.find(row => row[0] === expected.month);
        expect(row, `month ${expected.month}`).toBeDefined();
        compare(row?.[2], expected.monthlyMIP, fixture.absoluteTolerance, `month ${expected.month} monthly MIP`);
        compare(row?.[3], expected.acceleratedMIP, fixture.absoluteTolerance, `month ${expected.month} accelerated MIP`);
      }
    });
  }

  it('keeps original duration and premiums when prepayment changes request month', () => {
    const fixture = projections.fixtures.find(value => value.id === 'historical-prepayments-do-not-stop-billing')!;
    const result = runProgramComposition(inputs(fixture.input));
    expect(metric(result, 'Original-schedule projected final MIP month')).toBe(136);
    expect(metric(result, 'Monthly-plan prepayment request month')).toBe(60);
    expect(result.table?.rows[59][2]).toBeGreaterThan(0);
    expect(result.table?.rows[60][2]).toBeGreaterThan(0);
    expect(result.table?.rows[135][2]).toBeGreaterThan(0);
    expect(result.table?.rows[136][2]).toBe(0);
    expect(result.notes?.join(' ')).toMatch(/do not automatically stop billing/i);
  });

  it('does not keep charging MIP after payoff to satisfy the five-year minimum', () => {
    const fixture = projections.fixtures.find(value => value.id === 'historical-early-payoff-minimum')!;
    const result = runProgramComposition(inputs(fixture.input));
    expect(metric(result, 'Original-schedule projected final MIP month')).toBe(60);
    expect(metric(result, 'Monthly payoff payments')).toBe(24);
    expect(metric(result, 'Monthly-plan prepayment request month')).toBe('Paid off before a request is needed');
    expect(metric(result, 'Accelerated-plan prepayment request month')).toBe('Paid off before a request is needed');
    expect(result.table?.rows[23][2]).toBeGreaterThan(0);
    expect(result.table?.rows[24][2]).toBe(0);
    expect(result.table?.rows[24][3]).toBe(0);
  });

  it('rejects unsupported program and original due-date chronology', () => {
    const input = inputs(projections.fixtures[0].input);
    expect(() => runProgramComposition({...input, program: 'VApurchase'})).toThrow(/FHA forward/i);
    expect(() => runProgramComposition({...input, firstPaymentDate: '2012-03-19'})).toThrow(/precede closing/i);
  });

  it('does not infer threshold completion from an under-amortizing original payment', () => {
    const input = inputs(projections.fixtures[0].input);
    expect(() => runProgramComposition({...input, manualOriginalPi: '100'})).toThrow(/does not reach/i);
  });

  it('honors a manually supplied final billed month without applying historical eligibility', () => {
    const input = inputs(projections.fixtures[0].input);
    const result = runProgramComposition({...input, policySource: 'manual', manualLastMipMonth: '12', verifiedEligibleMMI: 'no'});
    expect(metric(result, 'Original-schedule projected final MIP month')).toBeUndefined();
    expect(result.table?.rows[11][2]).toBeGreaterThan(0);
    expect(result.table?.rows[12][2]).toBe(0);
  });
});

describe('Public historical FHA controls', () => {
  it('dispatches string yes/no eligibility and exposes request separately from processing', async () => {
    const mode = modeFor('fha-historical-78');
    const input = {...defaults(mode), ...inputs(base), servicerCancellationConfirmed: 'no'};
    const result = await calculate('finance', mode, input);
    expect(metric(result, 'Meets modeled request conditions')).toBe('Yes');
    expect(metric(result, 'Cancellation processing confirmed')).toBe('No');
    expect(metric(result, 'Equivalent note threshold')).toBe(79365);
    expect(runHistoricalFha(input).notes?.join(' ')).toMatch(/actually financed/i);
  });

  it('keeps the original-price controls active and ignores the hidden manual stop field', async () => {
    const mode = modeFor('program-composed');
    const input = {...defaults(mode), ...inputs(projections.fixtures[0].input), manualLastMipMonth: 'invalid hidden field'};
    const result = await calculate('finance', mode, input);
    expect(metric(result, 'Original-schedule projected final MIP month')).toBe(136);
    expect(metric(result, 'Monthly-plan total MIP')).toBeCloseTo(5501.88, 6);
    expect(mode.fields.find(field => field.key === 'policySource')?.options?.some(option => option.value === 'historical')).toBe(true);
  });
});
