import {languages, type Locale} from './config';

// Localize measured results while keeping dates, code, ratios and equations exact.
export function formatExampleResult(result: string, locale: Locale) {
  const parts = result.match(/^([+−-]?)(CA\$|\$|£|€)?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?( ?[%°×\p{L}²³/·]*)$/u);
  if (!parts) return result;
  const [, sign, symbol, integer, fraction = '', unit] = parts;
  const currency = {'$': 'USD', 'CA$': 'CAD', '£': 'GBP', '€': 'EUR'}[symbol];
  const digits = Math.max(fraction.length - 1, 0);
  const number = new Intl.NumberFormat(locale === 'ar' ? 'ar-u-nu-arab' : languages[locale].tag, {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
    signDisplay: sign === '+' ? 'always' : 'auto',
    ...(integer.includes(',') ? {useGrouping: 'always' as const} : {}),
    ...(currency ? {style: 'currency', currency} as const : {}),
  });
  // The match above verifies the decimal literal. Passing it as text preserves
  // the source precision even when the integer exceeds Number.MAX_SAFE_INTEGER.
  const value = ((sign === '−' ? '-' : sign) + integer.replaceAll(',', '') + fraction) as Intl.StringNumericLiteral;
  return number.format(value) + unit;
}
