import {describe, expect, it} from 'vitest';
import {catalog, definitionMap} from '@/lib/calculators/registry';
import {calculate} from '@/lib/calculators/engine';
import {defaults, type Mode, type Values} from '@/lib/calculators/types';

async function run(slug: string, mode: Mode, inputs: Values = {}) {
  const result = await calculate(catalog.find(tool => tool.slug === slug)!.category, mode, {...defaults(mode), ...inputs});
  return {result, values: Object.fromEntries(result.metrics.map(metric => [metric.label, metric.value]))};
}

describe('calculator opening examples match their stated purpose', () => {
  it('opens payment with a term and repayment with a payment budget, preserving mortgage examples', async () => {
    const payment = definitionMap.get('payment-calculator')!.modes[0];
    const repayment = definitionMap.get('repayment-calculator')!.modes[0];
    expect(payment.id).toBe('loan');
    expect(repayment.id).toBe('payoff');
    const scheduled = await run('payment-calculator', payment);
    expect(scheduled.values['Regular monthly payment']).toBeCloseTo(313.3636546143113, 8);
    expect(scheduled.values['Total interest']).toBeCloseTo(1281.091566115206, 8);
    const budget = await run('repayment-calculator', repayment);
    expect(budget.result.table?.rows).toHaveLength(38);
    expect(budget.values['Total interest']).toBeCloseTo(1346.9499782182952, 8);
    const extra = await run('repayment-calculator', repayment, {extra: '100'});
    expect(extra.result.table?.rows).toHaveLength(28);
    expect(extra.values['Total interest']).toBeCloseTo(976.0447110065924, 8);
    expect(Number(budget.values['Total interest']) - Number(extra.values['Total interest'])).toBeCloseTo(370.9052672117028, 8);
    for (const slug of ['loan-calculator', 'mortgage-payoff-calculator']) {
      expect(defaults(definitionMap.get(slug)!.modes[0])).toMatchObject({principal: '250000', rate: '6.5', years: '30'});
    }
  });

  it('opens future value with its published lump-sum example without changing regular savings contributions', async () => {
    const future = definitionMap.get('future-value-calculator')!.modes[0];
    const {values} = await run('future-value-calculator', future);
    expect(values['Projected balance']).toBeCloseTo(16288.94626777442, 7);
    expect(values['Total contributions']).toBe(10000);
    for (const slug of ['savings-calculator', 'compound-interest-calculator', 'interest-calculator']) {
      expect(defaults(definitionMap.get(slug)!.modes[0])).toMatchObject({contribution: '200', rate: '7', frequency: '12'});
    }
  });

  it.each(['calorie-calculator', 'tdee-calculator', 'macro-calculator', 'carbohydrate-calculator', 'fat-intake-calculator', 'protein-calculator'])('%s opens with activity-adjusted maintenance and preserves the resting-only option', async slug => {
    const mode = definitionMap.get(slug)!.modes.find(mode => ['tdee', 'macro-energy'].includes(mode.algorithm))!;
    const {values} = await run(slug, mode);
    expect(defaults(mode).activity).toBe('1.2');
    expect(values['Estimated maintenance energy']).toBeCloseTo(1978.5, 8);
    const resting = await run(slug, mode, {activity: '1'});
    expect(resting.values['Estimated maintenance energy']).toBeCloseTo(1648.75, 8);
  });

  it.each([
    ['mifflin', 'male', 1648.75], ['mifflin', 'female', 1482.75],
    ['harris', 'male', 1695.667], ['harris', 'female', 1507.133],
    ['katch', 'male', 1579.6], ['katch', 'female', 1579.6],
  ])('retains the documented %s resting equation using the %s coefficient', async (method, sex, expected) => {
    const mode = definitionMap.get('bmr-calculator')!.modes[0];
    const {values} = await run('bmr-calculator', mode, {method: String(method), sex: String(sex)});
    expect(values['Estimated resting energy']).toBeCloseTo(Number(expected), 8);
    expect(mode.fields.some(field => field.key === 'activity')).toBe(false);
  });

  it('reproduces the macro split example and rejects over-allocation', async () => {
    const mode = definitionMap.get('macro-calculator')!.modes.find(mode => mode.id === 'split')!;
    const {values} = await run('macro-calculator', mode);
    expect(values.Protein).toBe(100);
    expect(values.Carbohydrate).toBe(250);
    expect(values.Fat).toBeCloseTo(66.66666666666667, 8);
    await expect(run('macro-calculator', mode, {protein: '30'})).rejects.toThrow('100%');
  });
});
