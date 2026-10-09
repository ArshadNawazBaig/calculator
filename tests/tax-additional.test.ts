import {describe, expect, it} from 'vitest';
import * as tax from '@/lib/calculators/tax-additional';
import {federalComposition} from '@/lib/calculators/tax-composition';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults, type Mode, type Result, type Values} from '@/lib/calculators/types';
import references from './fixtures/tax-additional-reference.json';
import qbiEitcReferences from './fixtures/tax-additional-qbi-eitc-reference.json';
import compositionEdges from './fixtures/tax-additional-composition-edge.json';

type Fixture = {
  id: string;
  function?: string;
  input: Record<string, unknown>;
  expected: unknown;
  absoluteTolerance: number;
};
const algorithms: Record<string, (input: Record<string, unknown>) => unknown> = {
  tips: tax.tips,
  overtime: tax.overtime,
  carInterest: tax.carInterest,
  educationRefundability: tax.educationRefundability,
  education: tax.education,
  studentLoanInterest: tax.studentLoanInterest,
  traditionalIra: tax.traditionalIra,
  qbi: tax.qbi,
  qbiSection68: tax.qbiSection68,
  eitcContinuousEstimate: tax.eitcContinuousEstimate,
};

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
  } else {
    expect(actual, path).toEqual(expected);
  }
}

// Reference calculations are independent Python Decimal equations. These adapters
// only translate documented input names, never calculate expected product outputs.
function adapt(fixture: Fixture) {
  const input = {...fixture.input};
  if (input.livedApartEntireYear !== undefined) input.livedApartAllYear = input.livedApartEntireYear;
  if (input.schedule1A !== undefined) input.otherBelowAGIDeductions = input.schedule1A;
  if (input.eligibilityConfirmed !== undefined) input.eligible = input.eligibilityConfirmed;
  if (Number(input.verifiedActiveQualifiedQbi ?? 0) > 0) input.materialParticipationConfirmed = true;
  return input;
}

for (const [name, fixtures] of [
  ['additional deductions and education', references.fixtures],
  ['QBI and continuous EITC estimates', qbiEitcReferences.fixtures],
] as const) {
  describe(`Independent 2026 ${name}`, () => {
    for (const fixture of fixtures as unknown as Fixture[]) {
      it(fixture.id, () => {
        compare(algorithms[fixture.function!](adapt(fixture)), fixture.expected, fixture.absoluteTolerance);
      });
    }
  });
}

describe('Independent composed-return ordering and reconciliation', () => {
  for (const fixture of compositionEdges.fixtures as unknown as Fixture[]) {
    it(fixture.id, () => {
      compare(federalComposition(fixture.input), fixture.expected, fixture.absoluteTolerance);
    });
  }

  it('requires a verified adjustment for the coordinated IRA/Social Security worksheet', () => {
    expect(() => federalComposition({
      persons: [{wages: 80000}], socialSecurityBenefits: 20000,
      iraEnabled: true, iraContributors: [],
    })).toThrow(/coordinated IRS worksheet/i);
  });

  it('rejects duplicate IRA contributor labels rather than deducting one person twice', () => {
    const contributor = {name: 'Person A', age: 40, contribution: 7500, compensationAvailable: 50000};
    expect(() => federalComposition({
      filing: 'marriedJoint', persons: [{wages: 50000}, {wages: 50000}],
      iraEnabled: true, iraContributors: [contributor, {...contributor, name: ' person a '}],
    })).toThrow(/unique/i);
  });

  it('requires an itemized or standard base when QBI is computed locally', () => {
    expect(() => federalComposition({persons: [{wages: 100000}], qbiMethod: 'computed',
      qbiAdjustedQbiBeforeTips: 50000, deductionChoice: 'verified', verifiedDeduction: 20000,
    })).toThrow(/separately verified QBI/i);
  });

  it('combines the three-child ACTC branch with a separately counted EITC estimate', () => {
    compare(federalComposition({taxYear: 2026, persons: [{wages: 30000}], qualifyingChildren: 3,
      eitcEnabled: true, eitcEligible: true, eitcChildren: 3, eitcEarnedIncome: 30000,
    }), {regularTax: 1420, nonrefundableCTC: 1420, ACTC: 4125,
      estimatedEITC: 6944.234, refundableCredits: 11069.234}, 1e-8);
  });
});

describe('Eligibility and input boundaries', () => {
  it('requires material-participation confirmation for the QBI minimum', () => {
    const input = {adjustedQbiBeforeTips: 1000, taxableBeforeQbiWithoutSection68: 10000, verifiedActiveQualifiedQbi: 1000};
    compare(tax.qbi(input), {deduction: 200, minimumDeduction: 0}, 1e-8);
    compare(tax.qbi({...input, materialParticipationConfirmed: true}), {deduction: 400, minimumDeduction: 400}, 1e-8);
  });

  it('does not revive a fully excluded SSTB using a supplied active-income amount', () => {
    compare(tax.qbi({
      SSTB: true, adjustedQbiBeforeTips: 50000, taxableBeforeQbiWithoutSection68: 300000,
      verifiedActiveQualifiedQbi: 50000, materialParticipationConfirmed: true,
    }), {deduction: 0}, 1e-8);
  });

  it('rejects claimed car interest that has already been deducted beyond its total', () => {
    expect(() => tax.carInterest({MAGI: 50000, loans: [{qualifiedInterest: 1000, deductedElsewhere: 1001}]})).toThrow(/cannot exceed/i);
  });

  it('requires distinct education student labels', () => {
    expect(() => tax.education({MAGI: 50000, students: [
      {identifier: 'Student A', credit: 'aotc', adjustedQualifiedExpenses: 4000},
      {identifier: ' student a ', credit: 'llc', adjustedQualifiedExpenses: 4000},
    ]})).toThrow(/unique/i);
  });

  it('does not allow a claimable dependent to deduct student-loan interest', () => {
    expect(tax.studentLoanInterest({MAGI: 40000, qualifiedInterest: 2500, dependent: true}).deduction).toBe(0);
  });

  it('does not allow the separated-spouse EITC exception without a qualifying child', () => {
    expect(tax.eitcContinuousEstimate({
      filing: 'marriedSeparate', children: 0, earnedIncome: 9000, AGI: 9000,
      separatedSpouseEligibilityConfirmed: true, eligible: true,
    }).estimatedCredit).toBe(0);
  });

  it('does not award EITC when the eligibility confirmation is false', () => {
    expect(tax.eitcContinuousEstimate({children: 1, earnedIncome: 20000, AGI: 20000, eligible: false}).estimatedCredit).toBe(0);
  });

  it('rejects invalid count and nonfinite values', () => {
    expect(() => tax.eitcContinuousEstimate({children: 1.5, earnedIncome: 20000, AGI: 20000})).toThrow();
    expect(() => tax.overtime({qualifiedPremium: Infinity, MAGI: 40000})).toThrow(/finite/i);
    expect(() => tax.studentLoanInterest({qualifiedInterest: -1, MAGI: 40000})).toThrow(/nonnegative/i);
  });
});

const modeFor = (algorithm: string): Mode => {
  const mode = definitionMap.get('tax-calculator')?.modes.find(value => value.algorithm === algorithm);
  if (!mode) throw Error(`Missing tax mode: ${algorithm}`);
  return mode;
};
const metric = (result: Result, label: string) => result.metrics.find(value => value.label === label)?.value;

describe('Public tax controls and dispatcher', () => {
  it('requires explicit eligibility confirmation before deducting entered tips', async () => {
    const mode = modeFor('tax-tips-2026');
    const values: Values = {...defaults(mode), employeeTips: '12000'};
    expect(values.eligible).toBe('no');
    expect(metric(await calculate('finance', mode, values), 'Deduction')).toBe(0);
    expect(metric(await calculate('finance', mode, {...values, eligible: 'yes'}), 'Deduction')).toBe(12000);
  });

  it('requires the student row and overall education eligibility to be confirmed', async () => {
    const mode = modeFor('tax-education-2026');
    const student = {identifier: 'Student A', credit: 'aotc', adjustedQualifiedExpenses: '4000', eligible: 'no'};
    const values = {...defaults(mode), MAGI: '50000', eligible: 'yes', students: JSON.stringify([student])};
    expect(metric(await calculate('finance', mode, values), 'Total Credit')).toBe(0);
    const confirmed = {...values, students: JSON.stringify([{...student, eligible: 'yes'}])};
    expect(metric(await calculate('finance', mode, confirmed), 'Total Credit')).toBe(2500);
  });

  it('includes Social Security in the student-interest MAGI through the public controls', async () => {
    const mode = modeFor('tax-federal-composed');
    const result = await calculate('finance', mode, {
      ...defaults(mode), socialSecurityBenefits: '20000', studentInterestEnabled: 'yes',
      studentInterestEligible: 'yes', studentQualifiedInterest: '2500',
    });
    expect(metric(result, 'Student Interest Deduction')).toBe(500);
    expect(metric(result, 'Adjusted gross income')).toBe(96500);
  });

  it('ignores malformed stale rows after their optional calculations are disabled', async () => {
    const mode = modeFor('tax-federal-composed');
    const result = await calculate('finance', mode, {
      ...defaults(mode), tipsEnabled: 'no', carEnabled: 'no', iraEnabled: 'no', educationEnabled: 'no',
      tipsBusinesses: 'invalid old rows', carLoans: 'invalid old rows',
      iraContributors: 'invalid old rows', educationStudents: 'invalid old rows',
    });
    expect(metric(result, 'Adjusted gross income')).toBe(80000);
    expect(metric(result, 'Modeled federal return tax')).toBe(8770);
  });

  it('requires public confirmation for the active-business QBI minimum', async () => {
    const mode = modeFor('tax-qbi-2026');
    const values: Values = {...defaults(mode), adjustedQbiBeforeTips: '1000',
      taxableBeforeQbiWithoutSection68: '10000', verifiedActiveQualifiedQbi: '1000'};
    expect(values.materialParticipationConfirmed).toBe('no');
    expect(metric(await calculate('finance', mode, values), 'Deduction')).toBe(200);
    expect(metric(await calculate('finance', mode, {...values, materialParticipationConfirmed: 'yes'}), 'Deduction')).toBe(400);
  });

  it('requires public EITC eligibility confirmation and labels the continuous estimate', async () => {
    const mode = modeFor('tax-eitc-estimate-2026');
    const values: Values = {...defaults(mode), earnedIncome: '20000', AGI: '20000', children: '1'};
    expect(values.eligible).toBe('no');
    expect(metric(await calculate('finance', mode, values), 'Estimated Credit')).toBe(0);
    const eligible = await calculate('finance', mode, {...values, eligible: 'yes'});
    expect(metric(eligible, 'Estimated Credit')).toBe(4427);
    expect(eligible.notes?.join(' ')).toMatch(/continuous EITC estimate/i);
  });

  it('applies computed QBI through the public auto-deduction path', async () => {
    const mode = modeFor('tax-federal-composed');
    const result = await calculate('finance', mode, {...defaults(mode),
      persons: JSON.stringify([{wages: 100000}]), deductionChoice: 'auto', otherVerifiedItemized: '17000',
      qbiMethod: 'computed', qbiAdjustedQbiBeforeTips: '50000', verifiedQBI: 'invalid stale value',
    });
    expect(metric(result, 'Qbi Deduction')).toBe(10000);
    expect(metric(result, 'Selected Deduction')).toBe(17000);
    expect(metric(result, 'Taxable Income')).toBe(73000);
  });
});
