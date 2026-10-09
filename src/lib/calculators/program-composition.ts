import {historicalFhaProjection} from './historical-fha';
import Decimal from 'decimal.js';
import {hudMipSchedule, runProgramMortgage} from './program-mortgages';
import {integer, positive, dateUTC, isoDate, num} from './helpers';
import {shiftMonths} from './finance-policy-engine';
import {parseRows, rowNumber} from './row-data';
import {metric as m, type Values, type Result} from './types';
const D = Decimal.clone({precision: 256});
type Cost = {name?: string; amount: number; unit?: string; growthPercent?: number};
type Extra = {month: number; amount: number};
export type ProgramScenario = {baseLoan: number; upfrontRate: number; financeFee?: boolean; apr: number; termMonths: number; annualMIP: number; lastMIPMonth: number; periods?: number; homePrice?: number; costs?: Cost[]; ownershipHorizonMonths?: number; monthlyExtra?: number; monthlyExtraStart?: number; annualExtra?: number; annualExtraStart?: number; oneTimeExtras?: Extra[]; downPayment?: number; otherClosingCash?: number; originalMonthlyPayment?: number};
export const premiumMonthCount = (paymentCount: number, periods: number) => Math.ceil(integer(paymentCount, 0, 2600) * 12 / integer(periods, 1, 26));
export function programComposition(v: ProgramScenario) {
  const term = integer(v.termMonths, 1, 1200), periods = v.periods ?? 12;
  if (![12, 26].includes(periods)) throw Error('Choose 12 monthly or 26 equal annual periods.');
  for (const [key, value] of Object.entries(v)) if (typeof value === 'number' && (!Number.isFinite(value) || value < 0)) throw Error(`Check ${key}; amounts and rates must be nonnegative and finite.`);
  positive(v.baseLoan, 'Base loan');
  if (term * Math.log1p(v.apr / 1200) > 400) throw Error('These rate and term inputs exceed supported amortization precision.');
  const upfrontFee = new D(v.baseLoan).times(v.upfrontRate).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP), note = new D(v.baseLoan).plus(v.financeFee ? upfrontFee : 0), monthlyRate = new D(v.apr).div(1200);
  const originalPayment = v.originalMonthlyPayment ? new D(v.originalMonthlyPayment) : monthlyRate.isZero() ? note.div(term) : note.times(monthlyRate).div(new D(1).minus(new D(1).plus(monthlyRate).pow(-term)));
  const periodicRate = periods === 12 ? monthlyRate : new D(1).plus(monthlyRate).pow(new D(12).div(26)).minus(1), regularPayment = periods === 12 ? originalPayment : originalPayment.div(2);
  const lastMIP = integer(v.lastMIPMonth, 0, term), horizon = integer(v.ownershipHorizonMonths ?? term, 1, 1200);
  const extraPostings: {targetMonth: number; period: number; amount: number; kind: string}[] = [];
  const post = (month: number, amount: number, kind: string) => {integer(month, 1, term); rowNumber(amount, 'Extra principal', 0); if (amount) extraPostings.push({targetMonth: month, period: Math.ceil(month * periods / 12), amount, kind});};
  const monthlyStart = integer(v.monthlyExtraStart ?? 1, 1, 1200), annualStart = integer(v.annualExtraStart ?? 12, 1, 1200);
  for (let month = monthlyStart; month <= term; month++) post(month, v.monthlyExtra ?? 0, 'Monthly');
  for (let month = annualStart; month <= term; month += 12) post(month, v.annualExtra ?? 0, 'Annual');
  for (const extra of v.oneTimeExtras || []) post(extra.month, extra.amount, 'One-time');
  const extras = new Map<number, Decimal>(); for (const e of extraPostings) extras.set(e.period, (extras.get(e.period) || new D(0)).plus(e.amount));
  let balance = note, totalInterest = new D(0), totalPI = new D(0), totalExtra = new D(0);
  const loanRows: {period: number; timeYears: number; opening: number; interest: number; regular: number; extra: number; ending: number}[] = [];
  for (let period = 1; period <= Math.ceil(term * periods / 12) && balance.gt('0.00000001'); period++) {
    const opening = balance, interest = balance.times(periodicRate), regular = D.min(regularPayment, balance.plus(interest));
    const extra = D.min(extras.get(period) || 0, D.max(0, balance.plus(interest).minus(regular)));
    balance = D.max(0, balance.plus(interest).minus(regular).minus(extra)); if (balance.lt('0.00000001')) balance = new D(0);
    totalInterest = totalInterest.plus(interest); totalPI = totalPI.plus(regular).plus(extra); totalExtra = totalExtra.plus(extra);
    loanRows.push({period, timeYears: period / periods, opening: opening.toNumber(), interest: interest.toNumber(), regular: regular.toNumber(), extra: extra.toNumber(), ending: balance.toNumber()});
  }
  const bucket = premiumMonthCount(loanRows.length, periods), chargeMonths = Math.min(bucket, lastMIP);
  const originalMips = hudMipSchedule(note.toNumber(), v.apr, originalPayment.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(), v.annualMIP, v.financeFee ? v.upfrontRate : 0, Math.ceil(term / 12));
  const premium = (month: number) => month <= chargeMonths ? originalMips[Math.floor((month - 1) / 12)].monthly : 0;
  const costs = (v.costs || []).map(c => {
    const amount = rowNumber(c.amount, 'Ownership cost', 0), growth = rowNumber(c.growthPercent ?? 0, 'Annual cost growth', -99.999, 100);
    if (!['annualDollars', 'monthlyDollars', 'annualPercentOfInitialHomePrice'].includes(c.unit || 'annualDollars')) throw Error('Choose a supported ownership cost basis.');
    const annual = amount * (c.unit === 'monthlyDollars' ? 12 : c.unit === 'annualPercentOfInitialHomePrice' ? (v.homePrice || 0) / 100 : 1);
    return {annual, growth: 1 + growth / 100};
  });
  const cost = (month: number) => costs.reduce((sum, c) => sum + c.annual / 12 * c.growth ** Math.floor((month - 1) / 12), 0);
  const monthlyRows = Array.from({length: horizon}, (_, i) => ({month: i + 1, ownershipCost: cost(i + 1), MIP: premium(i + 1)}));
  const within = loanRows.filter(r => r.period * 12 <= horizon * periods), loanPaymentsOverHorizon = within.reduce((sum, r) => sum + r.regular + r.extra, 0), loanInterestOverHorizon = within.reduce((sum, r) => sum + r.interest, 0);
  const ownershipCostsOverHorizon = monthlyRows.reduce((sum, r) => sum + r.ownershipCost, 0), MIPOverHorizon = monthlyRows.reduce((sum, r) => sum + r.MIP, 0), endingBalanceAtHorizon = within.at(-1)?.ending ?? note.toNumber();
  const upfrontCashFee = v.financeFee ? 0 : upfrontFee.toNumber(), cashAtClosing = (v.downPayment || 0) + (v.otherClosingCash || 0) + upfrontCashFee;
  return {notePrincipal: note.toNumber(), upfrontFee: upfrontFee.toNumber(), upfrontCashFee, contractMonthlyPI: originalPayment.toNumber(), equivalentPeriodicRate: periodicRate.toNumber(), regularPeriodicPI: regularPayment.toNumber(), paymentCount: loanRows.length, paidOff: balance.isZero(), remainingAtLoanHorizon: balance.toNumber(), payoffYears: loanRows.length / periods, payoffMonthBucket: bucket, finalPayment: (loanRows.at(-1)?.regular || 0) + (loanRows.at(-1)?.extra || 0), totalInterest: totalInterest.toNumber(), totalPI: totalPI.toNumber(), totalExtraPrincipal: totalExtra.toNumber(), MIPChargeCount: chargeMonths, firstMonthlyMIP: premium(1), totalMIP: Array.from({length: chargeMonths}, (_, i) => premium(i + 1)).reduce((a, b) => a + b, 0), ownershipHorizonMonths: horizon, ownershipCostsOverHorizon, loanInterestOverHorizon, loanPaymentsOverHorizon, MIPOverHorizon, endingBalanceAtHorizon, housingCashOverHorizon: cashAtClosing + loanPaymentsOverHorizon + MIPOverHorizon + ownershipCostsOverHorizon, firstMonthlyRequiredBudget: originalPayment.toNumber() + premium(1) + cost(1), firstYearPlannedRegularPI: regularPayment.times(periods).toNumber(), cashAtClosing, extraPostings, monthlyRows, loanRows};
}

export function runProgramComposition(v: Values): Result {
  const n = (key: string, fallback = 0) => num(v, key, fallback), manual = v.policySource === 'manual' || v.policySource === 'historical', historical = v.policySource === 'historical';
  const policy = manual ? null : runProgramMortgage('program-policy', {...v, monthlyExtra: '0', extraPayments: '[]'}), metric = (label: string) => Number(policy!.metrics.find(m => m.label === label)!.value);
  const term = integer(n('termMonths'), 1, 600), anchor = dateUTC(v.firstPaymentDate);
  const extraDates: string[] = [];
  const extras = parseRows(v.extraPayments, 'Extra principal').map(row => {
    let month: number;
    if (String(row.date || '').trim()) {const date = dateUTC(String(row.date)); month = 1; while (month <= term && shiftMonths(anchor, month - 1) < date) month++; integer(month, 1, term); extraDates.push(`${String(row.date)} → monthly due ${isoDate(shiftMonths(anchor, month - 1))}, target month ${month}.`);}
    else month = integer(rowNumber(row.month, 'Extra month', 1), 1, term);
    return {month, amount: rowNumber(row.amount, 'Extra principal', 0)};
  });
  const scenario: ProgramScenario = {baseLoan: n('baseLoanAmount'), upfrontRate: manual ? n('manualUpfrontRate') : metric(v.program === 'FHAstandard-forward' ? 'Upfront premium rate' : 'Funding fee rate'), financeFee: v.financeUpfrontFee === 'yes', apr: n('nominalAprPercent'), termMonths: term, annualMIP: manual ? n('manualAnnualMip') : metric('Annual MIP rate'), lastMIPMonth: manual ? Math.min(term, integer(n('manualLastMipMonth'), 0, 600)) : Math.min(360, metric('Scheduled MIP duration')), homePrice: n('homePrice'), ownershipHorizonMonths: integer(n('ownershipHorizonMonths'), 1, 1200), monthlyExtra: n('monthlyExtra'), monthlyExtraStart: n('monthlyExtraStart', 1), annualExtra: n('annualExtra'), annualExtraStart: n('annualExtraStart', 12), oneTimeExtras: extras, downPayment: n('downPaymentCash'), otherClosingCash: n('otherClosingCash'), originalMonthlyPayment: manual ? n('manualOriginalPi') : 0, costs: parseRows(v.ownershipCosts, 'Ownership costs').map(r => ({name: String(r.name), amount: rowNumber(r.amount, 'Cost', 0), unit: String(r.unit), growthPercent: rowNumber(r.growthPercent, 'Cost growth', -99.999, 100)}))};
  let scheduledCancellation:number|null=null;
  let historicalInputs:Record<string,unknown>|undefined;
  if(historical){
    if(v.program!=='FHAstandard-forward')throw Error('Historical 78% projection applies only to the eligible FHA forward program.');
    if(anchor<dateUTC(v.closingDate))throw Error('The first original due date cannot precede closing.');
    const original=programComposition({...scenario,monthlyExtra:0,annualExtra:0,oneTimeExtras:[],lastMIPMonth:0,periods:12});
    historicalInputs={...v,baseLoan:scenario.baseLoan,financedUpfrontAmount:scenario.financeFee?original.upfrontFee:0,noteBalance:original.notePrincipal};
    scheduledCancellation=historicalFhaProjection(historicalInputs,original.loanRows.map(r=>({month:r.period,ending:r.ending})));
    if(scheduledCancellation===null)throw Error('The original schedule does not reach the historical threshold within the entered term.');
    scenario.lastMIPMonth=scheduledCancellation;
  }
  const monthly = programComposition({...scenario, periods: 12}), accelerated = programComposition({...scenario, periods: 26});
  const requestMonth=(plan:typeof monthly,periods:number)=>{const month=historicalFhaProjection(historicalInputs!,plan.loanRows.map(r=>({month:Math.ceil(r.period*12/periods),ending:r.ending})));return month===0?'No annual MIP':month===null?'Not reached':plan.paidOff&&month>=plan.payoffMonthBucket?'Paid off before a request is needed':month;};
  const extraMetrics = historicalInputs ? [m('Original-schedule projected final MIP month',scheduledCancellation!),m('Monthly-plan prepayment request month',requestMonth(monthly,12)),m('Accelerated-plan prepayment request month',requestMonth(accelerated,26))] : [];
  const money = (label: string, value: number) => m(label, value, 'money');
  let table: Result['table'];
  if (v.tableView === 'monthly-loan' || v.tableView === 'accelerated-loan') {const z = v.tableView === 'monthly-loan' ? monthly : accelerated; table = {headers: ['Period', 'Elapsed years', 'Opening principal', 'Interest', 'Regular P&I', 'Extra principal', 'Ending principal'], rows: z.loanRows.map(r => [r.period, r.timeYears, r.opening, r.interest, r.regular, r.extra, r.ending])};}
  else if (v.tableView === 'extra-mapping') table = {headers: ['Target month', 'Extra kind', 'Amount', 'Monthly period', '26-period posting'], rows: monthly.extraPostings.map(e => [e.targetMonth, e.kind, e.amount, e.period, Math.ceil(e.targetMonth * 26 / 12)])};
  else table = {headers: ['Month', 'Ownership cost', 'Monthly-plan MIP', 'Accelerated-plan MIP'], rows: monthly.monthlyRows.map((r, i) => [r.month, r.ownershipCost, r.MIP, accelerated.monthlyRows[i].MIP])};
  return {metrics: [...extraMetrics,money('Initial required monthly budget', monthly.firstMonthlyRequiredBudget), money('Note principal', monthly.notePrincipal), money('Upfront program fee', monthly.upfrontFee), money('Cash at closing', monthly.cashAtClosing), money('Contractual monthly P&I', monthly.contractMonthlyPI), money('Accelerated P&I each equal annual period', accelerated.regularPeriodicPI), m('Monthly payoff payments', monthly.paidOff ? monthly.paymentCount : 'Not paid within horizon'), m('Accelerated payoff periods', accelerated.paidOff ? accelerated.paymentCount : 'Not paid within horizon'), m('Accelerated modeled duration', accelerated.payoffYears, 'number', 'years'), money('Monthly-plan total interest', monthly.totalInterest), money('Accelerated total interest', accelerated.totalInterest), money('Monthly-plan total MIP', monthly.totalMIP), money('Accelerated total MIP', accelerated.totalMIP), money('Modeled interest and MIP reduction', monthly.totalInterest + monthly.totalMIP - accelerated.totalInterest - accelerated.totalMIP), money('Ownership costs over shared horizon', monthly.ownershipCostsOverHorizon), money('Monthly-plan cash over horizon', monthly.housingCashOverHorizon), money('Accelerated cash over horizon', accelerated.housingCashOverHorizon), money('Monthly principal at horizon', monthly.endingBalanceAtHorizon), money('Accelerated principal at horizon', accelerated.endingBalanceAtHorizon)], table, notes: [historical ? 'Historical projection uses verified program dates and original price/appraisal, with entered vintage premium rates. The original scheduled threshold month is used as the estimated final chargeable MIP month. Prepayment request months do not automatically stop billing; payment history, lender/HUD processing and the actual billed end date must be confirmed. Use the manual final-month mode for a servicer-confirmed schedule.' : manual ? 'Manual historical scenario: upfront rate, annual MIP and final chargeable month are supplied assumptions. This does not automatically select vintage eligibility or 78% cancellation.' : 'Uses the separately verified current program fee/premium table. Current FHA loans do not automatically cancel MIP when actual principal reaches 78% LTV.', 'The accelerated comparison uses 26 equal annual periods, an equivalent rate preserving monthly compounding, and half the original monthly P&I. It is not a civil 14-day servicing schedule. Monthly extras remain 12 annual contributions and map to the next posting period.', 'FHA premiums retain the original monthly HUD amortization schedule, with full monthly buckets through payoff. Ownership costs continue over the same selected horizon after payoff. Cash comparisons show remaining debt separately; lower cash paid is not necessarily a net saving.', ...extraDates]};
}
