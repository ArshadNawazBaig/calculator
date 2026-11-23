import {describe, expect, it} from 'vitest';
import {definitions} from '@/lib/calculators/registry';
import {calculate} from '@/lib/calculators/engine';
import {defaults} from '@/lib/calculators/types';

// IRS Notice 2026-66 and IRS 401(k) contribution guidance, accessed November 2026.
// https://www.irs.gov/pub/irs-drop/n-26-66.pdf
// https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-401k-and-profit-sharing-plan-contribution-limits
const calculator = (slug:string, id:string) => {
  const selected = definitions.find(definition => definition.slug === slug)?.modes.find(mode => mode.id === id);
  if (!selected) throw new Error(`Missing mode ${slug}/${id}`);
  return selected;
};

describe('Year-specific retirement limits', () => {
  it('starts personal IRA growth with personal deposits and keeps the workplace plan example separate', () => {
    expect(defaults(calculator('ira-calculator','growth'))).toMatchObject({contribution:'5000',employer:'0'});
    expect(defaults(calculator('401k-calculator','growth'))).toMatchObject({contribution:'10000',employer:'3000'});
  });
  it.each([
    [49, 25500], [50, 34000], [59, 34000],
    [60, 37250], [63, 37250], [64, 34000],
  ])('applies the 2027 401(k) deferral limit at age %i', async (age, expected) => {
    const mode = calculator('401k-calculator', 'salary-match');
    const values = {...defaults(mode), age:String(age), salary:'1000000', employeeDeferralPercent:'100', years:'1', limitPolicy:'freeze-2027-limits', matchTiers:'[]'};
    const result = await calculate('finance', mode, values);
    expect(result.metrics.find(metric => metric.label === 'Employee contributions')?.value).toBe(expected);
    expect(result.notes?.[0]).toContain('2027 limits');
  });

  it('uses the 2027 compensation and additions caps while excluding catch-up from annual additions', async () => {
    const mode = calculator('401k-calculator', 'salary-match');
    const values = {...defaults(mode), age:'60', salary:'1000000', employeeDeferralPercent:'100', years:'1', limitPolicy:'freeze-2027-limits', matchTiers:JSON.stringify([{upperPercent:100, matchPercent:1000}])};
    const result = await calculate('finance', mode, values);
    expect(result.table?.rows[0].slice(3, 6)).toEqual([375000, 37250, 49500]);
  });

  it('retains the 2026 limits when that historical scenario is selected', async () => {
    const mode = calculator('401k-calculator', 'salary-match');
    const values = {...defaults(mode), age:'60', salary:'1000000', employeeDeferralPercent:'100', years:'1', limitPolicy:'freeze-2026-limits', matchTiers:JSON.stringify([{upperPercent:100, matchPercent:1000}])};
    const result = await calculate('finance', mode, values);
    expect(result.table?.rows[0].slice(3, 6)).toEqual([360000, 35750, 47500]);
    expect(result.notes?.[0]).toContain('2026 limits');
  });

  it.each([
    [49, 100000, 7500], [50, 100000, 8600], [50, 6000, 6000],
  ])('uses the 2027 combined IRA ceiling at age %i with $%i compensation', async (age, compensation, expected) => {
    for (const slug of ['ira-calculator', 'roth-ira-calculator']) {
      const mode = calculator(slug, '2027-ceiling');
      const result = await calculate('finance', mode, {...defaults(mode), age:String(age), earnedCompensation:String(compensation)});
      expect(result.metrics[0]).toMatchObject({label:'2027 combined IRA contribution ceiling', value:expected});
      expect(result.notes?.[0]).toContain('MAGI restrictions');
    }
  });
});
