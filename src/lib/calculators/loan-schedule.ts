import {dateUTC, integer, isoDate, nonnegative, num} from './helpers';
import {defaults, type Mode, type Result, type Values} from './types';

export type ScheduleOptions = {extra?: number; extraAnnual?: number; oneTime?: number; oneMonth?: number; payment?: number; start?: string};
type LoanTerms = {principal: number; monthlyRate: number; months: number; options: ScheduleOptions};
type ResultTable = NonNullable<Result['table']>;
export type CalculatorExample = Omit<Result, 'table'> & {table?: Omit<ResultTable, 'rows'> & {rows: ResultTable['rows'] | LoanTerms}};

export function isResidentialMortgage(algorithm: string) {
  return algorithm === 'mortgage' || algorithm === 'mortgage-ca' || algorithm === 'mortgage-uk';
}

export function residentialLoanTerms(algorithm: string, values: Values): LoanTerms {
  const rate = num(values, 'rate');
  return {
    principal: num(values, 'price') * (1 - num(values, 'down') / 100),
    monthlyRate: algorithm === 'mortgage-ca' ? Math.expm1(Math.log1p(rate / 200) / 6) : rate / 1200,
    months: Math.round(num(values, 'years') * 12),
    options: {extra: num(values, 'extra'), extraAnnual: num(values, 'extraAnnual'), oneTime: num(values, 'oneTime'),
      oneMonth: num(values, 'oneMonth'), start: values.start},
  };
}

export function amortizationSchedule(principal: number, monthlyRate: number, months: number, options: ScheduleOptions = {}) {
  nonnegative(principal, 'Loan amount');
  integer(months, 1, 1200);
  nonnegative(monthlyRate, 'Interest rate');
  const payment = options.payment ?? (monthlyRate === 0 ? principal / months : principal * monthlyRate / -Math.expm1(-months * Math.log1p(monthlyRate)));
  const extra = nonnegative(options.extra || 0, 'Extra payment');
  if (principal > 0 && payment + extra <= principal * monthlyRate) throw new Error('Payment must exceed monthly interest to repay the balance.');

  let balance = principal, totalInterest = 0, totalPaid = 0;
  const rows: ResultTable['rows'] = [];
  const start = dateUTC(options.start || '2026-11-01');
  for (let month = 1; month <= months && balance > 0.0000001; month++) {
    const interest = balance * monthlyRate;
    const extraPayment = extra + (month % 12 === 0 ? options.extraAnnual || 0 : 0) + (month === options.oneMonth ? options.oneTime || 0 : 0);
    const paid = Math.min(balance + interest, payment + extraPayment);
    const principalPaid = paid - interest;
    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;
    totalPaid += paid;
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + month - 1, 1));
    rows.push([month, isoDate(date).slice(0, 7), paid, principalPaid, interest, balance]);
  }
  return {payment, rows, interest: totalInterest, total: totalPaid, balance, months: rows.length};
}

// Hydration and exports can reproduce every example row from the original terms.
export function compactDefaultExample(mode: Mode, result: Result | null): CalculatorExample | null {
  if (!result?.table || !isResidentialMortgage(mode.algorithm)) return result;
  return {...result, table: {...result.table, rows: residentialLoanTerms(mode.algorithm, defaults(mode))}};
}

export function readCalculatorExample(example: CalculatorExample | null): Result | null {
  if (!example) return null;
  const {table, ...summary} = example;
  if (!table) return summary;
  const terms = table.rows;
  const rows = Array.isArray(terms) ? terms : amortizationSchedule(terms.principal, terms.monthlyRate, terms.months, terms.options).rows;
  return {...summary, table: {...table, rows}};
}
