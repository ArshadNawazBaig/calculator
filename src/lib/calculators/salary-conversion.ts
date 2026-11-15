import type {Result} from './types';

/** Equivalent gross pay, using the same 52-week schedule as both salary modes. */
export function salaryConversionTable(annual: number, hoursPerWeek: number, daysPerWeek: number): NonNullable<Result['table']> {
  return {
    headers: ['Pay period', 'Gross pay ($)'],
    rows: [
      ['Hourly', annual / (hoursPerWeek * 52)],
      ['Daily', annual / (daysPerWeek * 52)],
      ['Weekly', annual / 52],
      ['Biweekly (26 per year)', annual / 26],
      ['Semimonthly (24 per year)', annual / 24],
      ['Monthly', annual / 12],
      ['Quarterly', annual / 4],
      ['Annual', annual],
    ],
    translateColumns: [0],
  };
}
