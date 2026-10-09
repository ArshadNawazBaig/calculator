import {describe, expect, it} from 'vitest';
import {annualPay, runAnnualPay} from '@/lib/calculators/annual-pay';
import {marriageComposition} from '@/lib/calculators/tax-composition';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults, type Mode, type Result, type Values} from '@/lib/calculators/types';
import references from './fixtures/annual-pay-reference.json';

type Fixture = {id: string; input: Record<string, unknown>; expected: unknown; absoluteTolerance: number};
function compare(actual: unknown, expected: unknown, tolerance: number, path = 'result') {
  if (expected !== null && typeof expected === 'object') {
    expect(actual, path).not.toBeNull();
    expect(typeof actual, path).toBe('object');
    for (const [key, value] of Object.entries(expected)) {
      compare((actual as Record<string, unknown>)[key], value, tolerance, `${path}.${key}`);
    }
  } else if (typeof expected === 'number') {
    expect(typeof actual, path).toBe('number');
    expect(Number.isFinite(actual), path).toBe(true);
    expect(Math.abs(Number(actual) - expected), `${path}: expected ${expected}, received ${actual}`).toBeLessThanOrEqual(tolerance);
  } else expect(actual, path).toEqual(expected);
}
const modeFor = (slug: string, algorithm: string): Mode => {
  const mode = definitionMap.get(slug)?.modes.find(value => value.algorithm === algorithm);
  if (!mode) throw Error(`Missing mode ${slug}/${algorithm}`);
  return mode;
};
const metric = (result: Result, label: string) => result.metrics.find(value => value.label === label)?.value;

describe('Independent annual cash and federal/FICA reconciliation', () => {
  for (const fixture of references.annualFixtures as unknown as Fixture[]) {
    it(fixture.id, () => compare(annualPay(fixture.input as Values), fixture.expected, fixture.absoluteTolerance));
  }

  it('rejects employee deductions above earnings', () => {
    expect(() => annualPay({annualIncome: '10000', federalOnlyDeductions: '6000', allWageBaseDeductions: '5000'})).toThrow(/cannot exceed/i);
  });

  it('rejects business cash expenses above receipts in the nonnegative-profit scope', () => {
    expect(() => annualPay({employmentType: 'self', annualIncome: '10000', businessExpenses: '10001'})).toThrow(/cannot exceed/i);
  });

  it('rejects state/local rate totals above 100%', () => {
    expect(() => annualPay({annualIncome: '10000', stateRate: '60', cityRate: '41'})).toThrow(/at most 100/i);
  });

  it('uses pay periods only to divide the already calculated annual result', () => {
    const input = {annualIncome: '80000', periodsPerYear: '26'};
    const result = runAnnualPay(input);
    expect(metric(result, 'Estimated annual net cash')).toBe(65110);
    expect(metric(result, 'Monthly average')).toBeCloseTo(5425.833333333333, 8);
    expect(metric(result, 'Average per selected pay period')).toBeCloseTo(2504.230769230769, 8);
    expect(() => runAnnualPay({...input, periodsPerYear: '0'})).toThrow();
  });
});

describe('Independent marriage federal/state scenario comparison', () => {
  for (const fixture of references.marriageFixtures as unknown as Fixture[]) {
    it(fixture.id, () => compare(marriageComposition(fixture.input as Parameters<typeof marriageComposition>[0]), fixture.expected, fixture.absoluteTolerance));
  }

  it('requires eligible pre-marriage filing statuses and a joint comparison', () => {
    const input = references.marriageFixtures[0].input;
    expect(() => marriageComposition({...input, scenarioA: {...input.scenarioA, filing: 'marriedSeparate'}})).toThrow(/eligible/i);
    expect(() => marriageComposition({...input, joint: {...input.joint, filing: 'single'}})).toThrow(/eligible/i);
  });

  it('rejects state/local rates above 100% for any scenario', () => {
    const input = references.marriageFixtures[0].input;
    expect(() => marriageComposition({...input, joint: {...input.joint, stateLocalRatePercent: 101}})).toThrow(/at most 100/i);
  });
});

describe('Public annual-pay and marriage controls', () => {
  it('dispatches the three-income employee calculation with one annual Social Security cap', async () => {
    const mode = modeFor('take-home-pay-calculator', 'annual-tax-pay');
    const result = await calculate('finance', mode, {...defaults(mode), annualIncome: '140000', secondJobIncome: '70000', thirdJobIncome: '40000', stateRate: '0', cityRate: '0'});
    const fixture = references.annualFixtures.find(value => value.id === 'annual-three-jobs-one-social-cap')!;
    expect(metric(result, 'Estimated annual net cash')).toBeCloseTo(fixture.expected.annualNetCash, 8);
    expect(metric(result, 'Regular employee Social Security')).toBe(11439);
  });

  it('clears hidden self-employment cafeteria and disabled tax-module inputs', async () => {
    const mode = modeFor('take-home-pay-calculator', 'annual-tax-pay');
    const result = await calculate('finance', mode, {...defaults(mode), employmentType: 'self', annualIncome: '100000', businessExpenses: '20000', stateRate: '0', cityRate: '0',
      allWageBaseDeductions: 'invalid hidden amount', educationEnabled: 'no', educationStudents: 'invalid hidden rows',
    });
    const fixture = references.annualFixtures.find(value => value.id === 'annual-self-business-expenses')!;
    expect(metric(result, 'Estimated annual net cash')).toBeCloseTo(fixture.expected.annualNetCash, 8);
    expect(metric(result, 'Regular employee Social Security')).toBe(0);
  });

  it('includes QSS before-marriage eligibility and separates federal/state results', async () => {
    const mode = modeFor('marriage-calculator', 'tax-marriage-composed');
    const filing = mode.fields.find(field => field.key === 'filingA');
    expect(filing?.options?.some(option => option.value === 'qualifyingSurvivingSpouse')).toBe(true);
    const input: Values = {...defaults(mode), filingA: 'qualifyingSurvivingSpouse', wagesA: '100000', ssWagesA: '100000', medicareWagesA: '100000', wagesB: '50000', ssWagesB: '50000', medicareWagesB: '50000'};
    const plain = await calculate('finance', mode, input);
    const withState = await calculate('finance', mode, {...input, stateLocalRatePercentA: '5', stateLocalRatePercentB: '3', stateLocalRatePercentJoint: '4'});
    expect(metric(withState, 'Joint federal tax reduction')).toBe(metric(plain, 'Joint federal tax reduction'));
    expect(metric(withState, 'Person A assumed state/local tax')).toBe(5000);
    expect(metric(withState, 'Person B assumed state/local tax')).toBe(1500);
    expect(metric(withState, 'Joint assumed state/local tax')).toBe(6000);
    expect(metric(withState, 'Joint federal and assumed state/local reduction')).toBe(Number(metric(plain, 'Joint federal tax reduction')) + 500);
  });
});
