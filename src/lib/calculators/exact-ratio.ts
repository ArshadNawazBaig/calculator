import {metric, type Result} from './types';

type Fraction = {numerator: bigint; denominator: bigint};
const quantityLimit = 1_000_000_000_000n;
const absolute = (value: bigint) => value < 0n ? -value : value;

function gcd(a: bigint, b: bigint): bigint {
  a = absolute(a);
  b = absolute(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Keep entered decimals exact; converting through Number would lose their digits. */
function parseQuantity(raw: string, label: string): Fraction {
  const text = raw.trim();
  if (text.length > 120) throw Error(`${label} must use at most 120 characters.`);
  const fraction = text.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
  let numerator: bigint, denominator: bigint;
  if (fraction) {
    numerator = BigInt(fraction[1]);
    denominator = BigInt(fraction[2]);
    if (denominator === 0n) throw Error(`${label} cannot have a zero denominator.`);
  } else {
    const decimal = text.match(/^([+-]?)(\d+(?:\.\d*)?|\.\d+)(?:e([+-]?\d+))?$/i);
    if (!decimal) throw Error(`${label} must be a whole number, decimal, or integer fraction such as 3/4.`);
    const exponent = Number(decimal[3] || '0');
    if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) throw Error(`${label} must use an exponent from -100 to 100.`);
    const places = decimal[2].split('.')[1]?.length || 0;
    numerator = BigInt(decimal[2].replace('.', '')) * (decimal[1] === '-' ? -1n : 1n);
    const shift = exponent - places;
    denominator = shift < 0 ? 10n ** BigInt(-shift) : 1n;
    if (shift > 0) numerator *= 10n ** BigInt(shift);
  }
  if (denominator < 0n) { numerator = -numerator; denominator = -denominator; }
  if (absolute(numerator) > quantityLimit * denominator) throw Error(`${label} must be between -1,000,000,000,000 and 1,000,000,000,000.`);
  const divisor = gcd(numerator, denominator);
  return {numerator: numerator / divisor, denominator: denominator / divisor};
}

export function simplifyExactRatio(first: string, second: string): Result {
  const a = parseQuantity(first, 'First quantity'), b = parseQuantity(second, 'Second quantity');
  if (a.numerator === 0n && b.numerator === 0n) throw Error('Both quantities cannot be zero.');
  const common = a.denominator / gcd(a.denominator, b.denominator) * b.denominator;
  const wholeA = a.numerator * (common / a.denominator), wholeB = b.numerator * (common / b.denominator);
  const divisor = gcd(wholeA, wholeB);
  const simplified = `${wholeA / divisor} : ${wholeB / divisor}`;
  const rows: string[][] = [['Entered ratio', `${first.trim()} : ${second.trim()}`]];
  if (common !== 1n) {
    rows.push(['Write as exact fractions', `${a.numerator}/${a.denominator} : ${b.numerator}/${b.denominator}`]);
    rows.push([`Multiply both terms by ${common}`, `${wholeA} : ${wholeB}`]);
  }
  rows.push(['Greatest common factor of the whole-number terms', divisor.toString()]);
  rows.push([`Divide both terms by ${divisor}`, simplified]);
  return {
    metrics: [metric('Simplified ratio', simplified)],
    explanation: 'Clear any fractional denominators using their least common multiple, then divide both whole-number terms by their greatest common factor. Both operations preserve the ratio. The breakdown shows the exact steps without decimal rounding.',
    table: {headers: ['Step', 'Exact value'], rows, translateColumns: [0]},
  };
}
