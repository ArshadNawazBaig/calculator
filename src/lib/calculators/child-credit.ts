import Decimal from 'decimal.js';
import {integer} from './helpers';
import {rowNumber} from './row-data';
type Inputs = Record<string, unknown>;
const amount = (v: Inputs, key: string) => new Decimal(rowNumber(v[key] ?? 0, key, 0));
export function adjustedChildCreditPayroll(v: Inputs) {
  const result = amount(v, 'W2Box4').plus(amount(v, 'W2Box6')).plus(amount(v, 'finalWageAdditionalMedicare')).minus(amount(v, 'additionalMedicareWithheld')).plus(amount(v, 'finalSEAdditionalMedicare').div(2)).plus(amount(v, 'RRTAComponents'));
  if (result.isNegative()) throw Error('Adjusted payroll taxes cannot be negative. Verify the Additional Medicare worksheet.');
  return result.toNumber();
}
export function additionalChildCredit(v: Inputs) {
  const children = integer(rowNumber(v.qualifyingChildren ?? 0, 'Qualifying children', 0), 0, 20);
  const preliminary = amount(v, 'preliminaryDependentCredit'), used = amount(v, 'nonrefundableDependentCredit');
  if (used.gt(preliminary)) throw Error('Nonrefundable dependent credit cannot exceed the preliminary credit.');
  const refundableCapLine17 = Decimal.min(preliminary.minus(used), 1700 * children);
  const earnedIncomeAmountLine20 = Decimal.max(0, amount(v, 'ACTCEarnedIncome').minus(2500)).times(.15);
  const payrollAlternativeLine25 = Decimal.max(0, amount(v, 'verifiedAdjustedPayrollTaxesLine21').plus(amount(v, 'deductibleHalfBaseSE')).plus(amount(v, 'verifiedUnreportedPayrollTaxesLine22')).minus(amount(v, 'actualEITC')).minus(amount(v, 'excessSocialSecurityCredit')));
  const eligible = v.form2555 !== 'yes' && v.form2555 !== true;
  const ACTC = eligible ? Decimal.min(refundableCapLine17, children >= 3 ? Decimal.max(earnedIncomeAmountLine20, payrollAlternativeLine25) : earnedIncomeAmountLine20).toNumber() : 0;
  return {refundableCapLine17: refundableCapLine17.toNumber(), earnedIncomeAmountLine20: earnedIncomeAmountLine20.toNumber(), payrollAlternativeLine25: payrollAlternativeLine25.toNumber(), ACTC};
}
