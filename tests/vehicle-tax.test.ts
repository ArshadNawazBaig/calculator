import {describe, expect, it} from 'vitest';
import fixtures from './fixtures/vehicle-tax-reference.json';
import {definitionMap} from '@/lib/calculators/registry';
import {calculate} from '@/lib/calculators/engine';
import {vehicleTax} from '@/lib/calculators/vehicle-tax';
import {isFieldActive} from '@/lib/calculators/field-visibility';
import {updateInputs} from '@/lib/calculators/input-display';
import {defaults, type Mode, type Result, type Values} from '@/lib/calculators/types';

const modeFor = (slug = 'auto-loan-calculator'): Mode => {
  const mode = definitionMap.get(slug)?.modes.find(m => m.id === 'state-tax-financing');
  if (!mode) throw Error(`Missing vehicle tax mode on ${slug}`);
  return mode;
};
const mode = modeFor();
const base: Values = fixtures.baseValues;
const close = (actual: unknown, expected: number) => {
  expect(typeof actual).toBe('number');
  expect(Number.isFinite(actual)).toBe(true);
  expect(Math.abs(Number(actual) - expected)).toBeLessThanOrEqual(1e-7 + Math.abs(expected) * 1e-11);
};
const metric = (result: Result, label: string) => result.metrics.find(m => m.label === label)?.value;

describe('Primary-source vehicle taxable-base coverage', () => {
  for (const state of fixtures.states) {
    it(`${state.state}: ${state.automaticPreset ? 'verified scoped base' : 'requires verified manual treatment'}`, () => {
      const values = {...base, state: state.state};
      if (!state.automaticPreset) {
        expect(() => vehicleTax(values)).toThrow(/requires.*(?:verified|manual)/i);
        return;
      }
      const tax = vehicleTax(values);
      close(tax.taxableBase, state.expected!.taxableBase);
      close(tax.tax, state.expected!.tax);
      expect(tax.state.sources.length).toBeGreaterThan(0);
    });
  }
});

describe('All 39 independently researched state fixtures', () => {
  for (const fixture of fixtures.auditFixtures) {
    it(fixture.id, () => {
      if (fixture.kind === 'state-change') {
        const values = {...base, state: 'CA', salesTaxPercent: '7.25'};
        expect(updateInputs(mode, values, 'state', 'TX').salesTaxPercent).toBe('7.25');
        return;
      }
      const values = fixture.values as Values;
      if (fixture.kind === 'unsupported-preset') {
        expect(() => vehicleTax(values)).toThrow(/requires.*(?:verified|manual)/i);
        return;
      }
      const tax = vehicleTax(values);
      for (const [key, expected] of Object.entries(fixture.expected!)) {
        const actual = tax[key as 'tax' | 'taxableBase' | 'tradeCredit'];
        if (expected === null) expect(actual).toBeNull();
        else close(actual, expected as number);
      }
    });
  }
});

describe('Independent financing, inverse and offer comparison arithmetic', () => {
  for (const fixture of fixtures.financeFixtures) {
    it(fixture.id, async () => {
      const calculation = calculate('finance', mode, fixture.values);
      if ('errorPattern' in fixture) {
        await expect(calculation).rejects.toThrow(new RegExp(fixture.errorPattern!, 'i'));
        return;
      }
      const result = await calculation;
      const a = fixture.expected!;
      if ('expectedPromotional' in fixture) {
        const b = fixture.expectedPromotional!;
        close(metric(result, 'Rebate offer total cash'), a.totalCash);
        close(metric(result, 'Promotional offer total cash'), b.totalCash);
        close(metric(result, 'Savings with promotional rate'), a.totalCash - b.totalCash);
        for (const [label, key] of [['Monthly payment', 'payment'], ['Financed principal', 'principal'], ['Purchase tax', 'tax'], ['Upfront cash', 'upfront'], ['Loan interest', 'interest']] as const) {
          const row = result.table?.rows.find(row => row[0] === label);
          close(row?.[1], a[key]);
          close(row?.[2], b[key]);
        }
      } else {
        for (const [label, key] of [['Selling price', 'price'], ['Monthly payment', 'payment'], ['Financed principal', 'principal'], ['Purchase tax or vehicle fee', 'tax'], ['Upfront cash', 'upfront'], ['Total loan interest', 'interest'], ['Total cash paid', 'totalCash']] as const) {
          close(metric(result, label), a[key]);
        }
      }
    });
  }
});

describe('Vehicle inputs and defaults', () => {
  it('requires explicit confirmation before state presets on both routes', () => {
    for (const slug of ['auto-loan-calculator', 'cash-back-or-low-interest-calculator']) {
      const values = defaults(modeFor(slug));
      expect(values.taxMethod).toBe('manual');
      expect(values.scopeConfirmed).toBe('no');
      expect(() => vehicleTax({...values, taxMethod: 'state'})).toThrow(/confirm.*dealer/i);
    }
    expect(defaults(modeFor('cash-back-or-low-interest-calculator')).solve).toBe('compare');
  });
  it('shows only the applicable tax and comparison controls', () => {
    const active = (patch: Values) => {
      const values = {...base, ...patch};
      return mode.fields.filter(field => isFieldActive(mode, field, values)).map(field => field.key);
    };
    const manual = active({taxMethod: 'manual'});
    expect(manual).toEqual(expect.arrayContaining(['price', 'tradeTaxCredit', 'rebateTaxCredit', 'salesTaxPercent']));
    for (const key of ['payment', 'quotedTax', 'promotionalQuotedTax', 'scopeConfirmed', 'taxYear', 'promotionalAprPercent']) expect(manual).not.toContain(key);
    const quoted = active({taxMethod: 'quoted', solve: 'compare'});
    expect(quoted).toEqual(expect.arrayContaining(['quotedTax', 'promotionalQuotedTax', 'promotionalAprPercent', 'taxableFees', 'governmentFees']));
    for (const key of ['salesTaxPercent', 'tradeTaxCredit', 'rebateTaxCredit', 'scopeConfirmed']) expect(quoted).not.toContain(key);
    const reverse = active({taxMethod: 'state', solve: 'price'});
    expect(reverse).toEqual(expect.arrayContaining(['payment', 'scopeConfirmed', 'tradeEligible', 'rebateEligible', 'condition', 'taxYear']));
    expect(reverse).not.toContain('price');
  });
  it('ignores inactive quote and preset fields without changing manual calculation', async () => {
    const values = {...base, taxMethod: 'manual', scopeConfirmed: '', quotedTax: 'NaN', promotionalQuotedTax: '-1', taxYear: '1900'};
    const result = await calculate('finance', mode, values);
    close(metric(result, 'Purchase tax or vehicle fee'), 3800);
  });
});
