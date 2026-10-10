import type {Mode} from './types';
import type {Currency} from '@/lib/i18n/preferences';

type CurrencyPolicy = {kind: 'selectable'} | {kind: 'fixed'; currency: Currency} | {kind: 'independent'} | {kind: 'none'};
const fixedTools: Record<string, Currency> = {
  'canadian-mortgage-calculator': 'CAD', 'mortgage-calculator-uk': 'GBP',
  '401k-calculator': 'USD', 'ira-calculator': 'USD', 'roth-ira-calculator': 'USD',
  'rmd-calculator': 'USD', 'social-security-calculator': 'USD',
  'tax-calculator': 'USD', 'take-home-pay-calculator': 'USD', 'marriage-calculator': 'USD', 'estate-tax-calculator': 'USD',
  'fha-loan-calculator': 'USD', 'va-mortgage-calculator': 'USD', 'student-loan-calculator': 'USD', 'auto-lease-calculator': 'USD',
};
// Explicitly reviewed arithmetic models. New algorithms do not inherit a currency override.
const selectable = new Set([
  'mortgage', 'dated-loan', 'ownership-lines', 'biweekly-inferred',
  'loan', 'deferred', 'zero-bond', 'loan-frequencies', 'personal-cashcost', 'vehicle-price', 'equity-capacity', 'payoff',
  'auto-loan', 'rebate-compare', 'financing-lease', 'heloc', 'heloc-fees',
  'down-payment', 'down-price', 'save-time', 'down-percent', 'affordability', 'house-budget', 'rent', 'rent-obligations', 'dti', 'budget-lines',
  'refinance', 'refinance-horizon', 'growth', 'dual-contributions', 'fund-loads', 'fund-exit-load',
  'simple-interest', 'simple-inverse', 'tvm', 'nominal-tvm', 'present-value', 'pv-timing', 'interest-rate', 'apr', 'inflation',
  'annuity-payout', 'fund-longevity', 'withdrawal-frequency', 'annuity', 'retirement-target', 'retirement-save', 'retire-salary',
  'pension', 'pension-streams', 'college', 'college-share', 'debt-payoff', 'debt-budget-ledger', 'consolidation', 'consolidation-fee-comparison',
  'bond', 'dated-bond', 'dated-irr', 'roi', 'dated-roi', 'irr', 'regular-irr', 'payback', 'growing-payback',
  'depreciation', 'book-depreciation', 'margin', 'margin-target', 'stock-margin', 'retail-margin',
  'commission', 'commission-inverse', 'commission-tiers', 'discount', 'retail-discount', 'sequential-discount',
  'sales-tax', 'retail-tax', 'salary', 'salary-units', 'budget', 'rental', 'rental-holding', 'rent-buy', 'rent-buy-streams',
  'time-card', 'shift-card', 'tip', 'fuel-metric', 'fuel-us', 'fuel-odometer',
  'landscape', 'landscape-area', 'gravel-circle', 'landscape-purchasing', 'tile', 'tile-procurement', 'roof-packages', 'electricity', 'electricity-load',
]);
const fixedAlgorithms = new Set(['vehicle-state-tax', 'cpi-historical', 'lease', 'lease-price']);
const independent = new Set(['currency', 'currency-reference', 'currency-global', 'fuel-units', 'fx-margin', 'gdp', 'income-gdp']);

export function calculatorCurrencyPolicy(slug: string, mode: Mode): CurrencyPolicy {
  if (Object.hasOwn(fixedTools, slug)) return {kind: 'fixed', currency: fixedTools[slug]};
  if (fixedAlgorithms.has(mode.algorithm)) return {kind: 'fixed', currency: 'USD'};
  if (independent.has(mode.algorithm)) return {kind: 'independent'};
  if (selectable.has(mode.algorithm)) return {kind: 'selectable'};
  // Dollar-labelled inputs in an unreviewed mode retain their original currency.
  if (mode.fields.some(field => /\$|\bUSD\b/.test(field.unit || ''))) return {kind: 'fixed', currency: 'USD'};
  return {kind: 'none'};
}

export function resolveCalculatorCurrency(slug: string, mode: Mode, preferred: Currency, fallback = 'USD') {
  const policy = calculatorCurrencyPolicy(slug, mode);
  return policy.kind === 'fixed' ? policy.currency : policy.kind === 'selectable' ? preferred : fallback;
}
