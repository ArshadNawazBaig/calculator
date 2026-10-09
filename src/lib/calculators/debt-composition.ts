import Decimal from 'decimal.js';
import {dateUTC, isoDate, integer, num, positive} from './helpers';
import {shiftMonths} from './finance-policy-engine';
import {parseRows, rowNumber} from './row-data';
import {loanLedger} from './loan-ledger';
import {presentAnnuity} from './financial-roots';
import {metric as m, type Values, type Result} from './types';

const D = Decimal.clone({precision: 50});
export const debtCompositionAlgorithms = new Set(['debt-budget-ledger', 'consolidation-fee-comparison']);

function readDebts(v: Values) {
  const rows = parseRows(v.debts, 'Debts');
  if (!rows.length || rows.length > 30) throw Error('Enter between 1 and 30 debts.');
  return rows.map((row, index) => {
    const rate = rowNumber(row.aprPercent, 'Debt APR', 0);
    if (rate > 100) throw Error('Debt APR must be at most 100%.');
    return {name: String(row.name || `Debt ${index + 1}`), balance: new D(rowNumber(row.balance, 'Debt balance', 0)), rate: new D(rate).div(1200), minimum: new D(positive(rowNumber(row.minimumPayment, 'Minimum payment', 0))), payoff: 0};
  });
}

export function debtBudgetLedger(v: Values) {
  const debts = readDebts(v), initialDebt = debts.reduce((sum, d) => sum.plus(d.balance), new D(0));
  const minimums = debts.filter(d => d.balance.gt(0)).reduce((sum, d) => sum.plus(d.minimum), new D(0));
  const budget = v.budgetInput === 'total' ? new D(num(v, 'totalMonthlyBudget')) : minimums.plus(num(v, 'extraMonthly'));
  const extra = budget.minus(minimums);
  if (extra.lt(0)) throw Error('The monthly budget must cover the entered active minimum payments.');
  const anchor = dateUTC(v.firstPaymentDate), annual = new D(num(v, 'annualExtra'));
  const offset = integer(num(v, 'annualExtraPaymentMonth'), 1, 12), horizon = integer(num(v, 'horizonMonths'), 1, 1200);
  const extras = parseRows(v.oneTimeExtras, 'One-time extras').map(row => {
    const amount = new D(rowNumber(row.amount, 'Extra payment', 0));
    const dateText = String(row.date || '').trim();
    let month: number;
    if (dateText) {
      const date = dateUTC(dateText);
      if (!(anchor.getUTCFullYear() === 1 && anchor.getUTCMonth() === 0) && date < shiftMonths(anchor, -1)) throw Error('An extra date must not precede the opening payment period.');
      month = 1;
      while (month <= horizon && shiftMonths(anchor, month - 1) < date) month++;
      integer(month, 1, horizon);
    } else month = integer(rowNumber(row.paymentMonth, 'Extra payment month', 1), 1, horizon);
    return {month, amount, entered: dateText || `Payment ${month}`, effective: isoDate(shiftMonths(anchor, month - 1))};
  });
  let interestTotal = new D(0), paymentsTotal = new D(0);
  const rows: (string | number)[][] = [];
  for (let month = 1; month <= horizon && debts.some(d => d.balance.gt(0)); month++) {
    const interest = debts.map(d => d.balance.times(d.rate));
    debts.forEach((d, i) => { d.balance = d.balance.plus(interest[i]); });
    const payments = debts.map(d => D.min(d.minimum, d.balance));
    const capped = payments.reduce((sum, p) => sum.plus(p), new D(0));
    const regular = v.budgetPolicy === 'declining' ? capped.plus(extra) : budget;
    const scheduled = extras.filter(e => e.month === month).reduce((sum, e) => sum.plus(e.amount), month >= offset && (month - offset) % 12 === 0 ? annual : new D(0));
    let available = regular.plus(scheduled).minus(capped);
    debts.forEach((d, i) => { d.balance = d.balance.minus(payments[i]); });
    const priority = debts.map((debt, index) => ({debt, index})).sort((a, b) => (v.strategy === 'snowball' ? a.debt.balance.comparedTo(b.debt.balance) : b.debt.rate.comparedTo(a.debt.rate)) || a.index - b.index);
    for (const {debt, index} of priority) {
      const payment = D.min(debt.balance, available);
      debt.balance = debt.balance.minus(payment); payments[index] = payments[index].plus(payment); available = available.minus(payment);
    }
    debts.forEach(d => { if (d.balance.isZero() && !d.payoff && payments[debts.indexOf(d)].gt(0)) d.payoff = month; });
    const monthlyInterest = interest.reduce((sum, p) => sum.plus(p), new D(0)), paid = payments.reduce((sum, p) => sum.plus(p), new D(0));
    interestTotal = interestTotal.plus(monthlyInterest); paymentsTotal = paymentsTotal.plus(paid);
    rows.push([month, isoDate(shiftMonths(anchor, month - 1)), regular.toNumber(), scheduled.toNumber(), monthlyInterest.toNumber(), paid.toNumber(), available.toNumber(), debts.reduce((sum, d) => sum.plus(d.balance), new D(0)).toNumber(), ...debts.flatMap((d, i) => [payments[i].toNumber(), d.balance.toNumber()])]);
  }
  return {initialDebt: initialDebt.toNumber(), budget: budget.toNumber(), interest: interestTotal.toNumber(), paid: paymentsTotal.toNumber(), balance: debts.reduce((sum, d) => sum.plus(d.balance), new D(0)).toNumber(), rows, debts, extras};
}

export function runDebtComposition(op: string, v: Values): Result {
  const money = (label: string, value: number) => m(label, value, 'money');
  if (op === 'debt-budget-ledger') {
    const z = debtBudgetLedger(v), paid = z.balance === 0;
    return {metrics: [m('Payoff status', paid ? 'Paid off' : 'Not paid off within selected horizon'), m('Payoff payments', paid ? z.rows.length : 'Not reached'), money('Initial debt', z.initialDebt), money('Initial base monthly budget', z.budget), money('Total interest', z.interest), money('Total cash paid', z.paid), money('Ending balance', z.balance), ...z.debts.map(d => m(`${d.name}: payoff payment`, d.balance.isZero() ? d.payoff : 'Not reached'))], table: {headers: ['Payment', 'Due date', 'Regular budget', 'Scheduled extra', 'Interest', 'Cash paid', 'Unused available cash', 'Ending balance', ...z.debts.flatMap(d => [`${d.name}: paid`, `${d.name}: balance`])], rows: z.rows}, notes: ['Interest uses constant nominal APR / 12, with all capped minimums paid before priority extras. Actual credit-card daily-balance billing can differ.', v.budgetPolicy === 'declining' ? 'Declining budget includes capped active minimums plus the original monthly extra. Retired minimums and unused portions of final minimums are not rolled into other debts.' : 'Fixed budget retains the original monthly commitment as debts retire.', ...z.extras.map(e => `${e.entered} → payment ${e.month}, ${e.effective}${e.month > z.rows.length ? ' (after payoff; not needed)' : ''}. Dates map to the first monthly due date on or after the entered date; no intramonth interest saving is assumed.`)]};
  }
  const debts = readDebts(v), principal = debts.reduce((sum, d) => sum + d.balance.toNumber(), 0);
  positive(principal, 'Combined debt');
  const percent = num(v, 'feeValue') / 100, gross = v.percentageBase === 'gross-note' && v.feeUnit === 'percent';
  if (gross && (percent >= 1 || v.feeTreatment !== 'financed')) throw Error('Gross-note fees require financing and a percentage below 100%.');
  const fee = v.feeUnit === 'percent' ? (gross ? principal / (1 - percent) - principal : principal * percent) : num(v, 'feeValue');
  const upfront = v.feeTreatment === 'upfront' ? fee : 0, note = principal + (upfront ? 0 : fee);
  const loan = loanLedger(note, num(v, 'nominalAprPercent'), integer(num(v, 'months'), 1, 1200));
  const net = principal - upfront;
  positive(net, 'Net proceeds after upfront fee');
  let lo = 0, hi = Math.max(1, loan.payment / net);
  for (let i = 0; i < 150; i++) { const mid = (lo + hi) / 2; if (loan.payment * presentAnnuity(mid, loan.months) > net) lo = mid; else hi = mid; }
  const baseline = debtBudgetLedger({...v, budgetInput: 'extra', extraMonthly: '0', budgetPolicy: 'declining', annualExtra: '0', annualExtraPaymentMonth: '12', horizonMonths: '1200', oneTimeExtras: '[]', firstPaymentDate: '2026-01-31', strategy: 'avalanche'});
  const total = loan.total + upfront;
  return {metrics: [money('Debt principal', principal), money('Fee amount', fee), money('Note principal', note), money('Upfront cash', upfront), money('Monthly payment', loan.payment), money('Loan interest excluding fee', loan.interest), money('Total borrower cash', total), money('Interest plus fees', total - principal), m('Nominal annual cash-flow cost', (lo + hi) / 2 * 1200, 'percent'), m('Old payoff payments', baseline.balance === 0 ? baseline.rows.length : 'Not repaid within 100 years'), money('Old interest within horizon', baseline.interest), ...(baseline.balance === 0 ? [money('Old total payments', baseline.paid), money('Total cash saving', baseline.paid - total)] : [money('Old unpaid balance at horizon', baseline.balance)])], table: {headers: ['Month', 'Payment', 'Interest', 'Remaining principal'], rows: loan.rows.map(r => [r.period, r.regularPayment, r.interest, r.endingBalance])}, notes: ['The old comparison keeps each entered minimum without rollover or extra payments. Fees enter cash costs once; financed fees also accrue interest. A smaller payment alone does not establish savings.', 'Cash-flow cost is a monthly-yield comparison annualized by multiplying by 12. It is not a regulatory APR disclosure.']};
}
