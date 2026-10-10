import Decimal from 'decimal.js';
import policy from '@/data/vehicle-tax-2026.json';
import {num, integer, nonnegative} from './helpers';
import {presentAnnuity} from './financial-roots';
import {metric as m, type Result, type Values} from './types';
const D = Decimal.clone({precision: 50});
export function vehicleTax(v: Values, price = num(v, 'price'), rebate = num(v, 'rebate')) {
  const number = (key: string) => nonnegative(num(v, key), key), state = policy.states.find(s => s.state === v.state);
  if (!state) throw Error('Choose a supported US state or the District of Columbia.');
  nonnegative(price, 'Selling price'); nonnegative(rebate, 'Purchase rebate');
  const trade = number('trade'), taxableFees = number('taxableFees'), rate = number('salesTaxPercent');
  if (rate > 100) throw Error('The entered tax rate must be at most 100%.');
  let tradeCredit = 0, rebateCredit = 0;
  if (v.taxMethod === 'quoted') return {tax: number('quotedTax'), taxableBase: null, tradeCredit, rebateCredit, state, method: 'Actual quoted tax amount'};
  if (v.taxMethod === 'state') {
    if (v.scopeConfirmed !== 'yes') throw Error('Confirm the ordinary dealer transaction and state-specific eligibility conditions, or use a quoted tax amount.');
    if (num(v, 'taxYear') !== 2026) throw Error('Automatic state-base presets use 2026 rules. Use a verified manual amount for another year.');
    if (!state.automaticPresetSafe) throw Error(`${state.name} requires a separately verified tax amount or manual base treatment for the applicable vehicle and local rules.`);
    if (['AR','KS','LA'].includes(v.state) && v.condition !== 'new') throw Error('This state preset is limited to qualifying new-vehicle dealer purchases. Use a verified manual amount for a used vehicle.');
    if (state.eligibleTradeDeductible && v.tradeEligible === 'yes' && !(v.state === 'OH' && v.condition !== 'new')) tradeCredit = v.state === 'MI' ? Math.min(12000, trade) : trade;
    if (state.assignedManufacturerRebateDeductible && v.rebateEligible === 'yes') rebateCredit = rebate;
  } else if (v.taxMethod === 'manual') {
    tradeCredit = v.tradeTaxCredit === 'yes' ? trade : 0;
    rebateCredit = v.rebateTaxCredit === 'yes' ? rebate : 0;
  } else throw Error('Choose a tax calculation method.');
  const base = D.max(0, new D(price).plus(taxableFees).minus(tradeCredit).minus(rebateCredit));
  return {tax: base.times(rate).div(100).toNumber(), taxableBase: base.toNumber(), tradeCredit, rebateCredit, state, method: v.taxMethod === 'state' ? '2026 scoped state taxable-base preset' : 'Entered taxable-base assumptions'};
}
function scenario(v: Values, price: number, rebate: number, apr: number) {
  const tax = vehicleTax(v, price, rebate), months = integer(num(v, 'months'), 1, 1200), percent = v.downType === 'percent';
  const downValue = nonnegative(num(v, 'down'), 'Down payment');
  if (percent && downValue >= 100) throw Error('Percentage down payment must be below 100% for financed-price solving.');
  const down = percent ? price * downValue / 100 : downValue, fees = num(v, 'taxableFees') + num(v, 'governmentFees'), finance = v.financeTaxAndFees === 'yes';
  const principal = new D(price).minus(down).minus(num(v, 'trade')).plus(num(v, 'tradeDebt')).minus(rebate).plus(finance ? tax.tax + fees : 0).toNumber();
  const payment = principal / presentAnnuity(nonnegative(apr, 'APR') / 1200, months), upfront = down + (finance ? 0 : tax.tax + fees);
  return {...tax, price, principal, payment, upfront, interest: payment * months - principal, totalCash: upfront + payment * months};
}
export function runVehicleTax(v: Values): Result {
  const rebate = nonnegative(num(v, 'rebate'), 'Rebate'), apr = num(v, 'nominalAprPercent');
  let price = num(v, 'price');
  if (v.solve === 'price') {
    const target = nonnegative(num(v, 'payment'), 'Payment budget');
    if (scenario(v, 0, rebate, apr).payment > target) throw Error('The payment budget does not cover the entered debt and fees.');
    let low = 0, high = 1e12;
    if (scenario(v, high, rebate, apr).payment < target) throw Error('The inferred price exceeds the supported range.');
    for (let i = 0; i < 100; i++) {const mid = (low + high) / 2; if (scenario(v, mid, rebate, apr).payment < target) low = mid; else high = mid;}
    price = (low + high) / 2;
  }
  const a = scenario(v, price, rebate, apr); nonnegative(a.principal, 'Financed principal');
  const money = (label: string, value: number) => m(label, value, 'money');
  const notes = [`${a.method}. Rates remain your entered state/local or vehicle-tax rate; selecting a state never guesses a combined local rate.`, ...a.state.notes, 'Selling price is after unreimbursed dealer discounts. Manufacturer rebates are separate. An eligible trade uses gross allowance, while trade loan payoff adds to financing. Taxable dealer fees and nontaxable government fees are paid once.', 'State treatment was checked October 9, 2026. Private sales, leased trades, exemptions, separately sold vehicle credits, special vehicle classes, valuation floors and layered local taxes require their own verified treatment.'];
  if (v.solve === 'compare') {
    const vb=v.taxMethod==='quoted'?{...v,quotedTax:v.promotionalQuotedTax}:v;
    const b = scenario(vb, price, 0, num(v, 'promotionalAprPercent')); nonnegative(b.principal, 'Promotional financed principal');
    return {metrics: [money('Rebate offer total cash', a.totalCash), money('Promotional offer total cash', b.totalCash), money('Savings with promotional rate', a.totalCash - b.totalCash)], table: {headers: ['Component', 'Rebate offer', 'Promotional rate, no rebate'], rows: [['Monthly payment', a.payment, b.payment], ['Financed principal', a.principal, b.principal], ['Purchase tax', a.tax, b.tax], ['Upfront cash', a.upfront, b.upfront], ['Loan interest', a.interest, b.interest]]}, notes: [...notes, 'Both offers use the same price, term, down payment, trade, payoff and fees. The promotion removes the manufacturer rebate. Tax is recalculated from the selected base rules or taken from your separate verified quotes. Compare eligible offers; early payoff and the opportunity cost of cash are excluded.']};
  }
  return {metrics: [money('Selling price', price), money('Monthly payment', a.payment), money('Financed principal', a.principal), money('Purchase tax or vehicle fee', a.tax), ...(a.taxableBase === null ? [] : [money('Taxable base', a.taxableBase)]), money('Trade deduction from tax base', a.tradeCredit), money('Rebate deduction from tax base', a.rebateCredit), money('Upfront cash', a.upfront), money('Total loan interest', a.interest), money('Total cash paid', a.totalCash)], notes};
}
