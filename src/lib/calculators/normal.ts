// Original research implementation from DLMF power series and Laplace CF.
// Reference and independent verification: docs/research/math-everyday/numerical-fixes.json.
const SQRT2PI = Math.sqrt(2 * Math.PI);
function millsDenominator(z:number):number {
  let fraction = 0;
  for (let k = 200; k >= 1; k--) fraction = k / (z + fraction);
  return z + fraction;
}
export function normalSf(z:number):number {
  if (Number.isNaN(z)) return NaN;
  if (z === Infinity) return 0;
  if (z === -Infinity) return 1;
  if (z < 0) return 1 - normalSf(-z);
  if (z === 0) return 0.5;
  if (z < 2) {
    let term = z, sum = z;
    for (let n = 1; n < 100; n++) {
      term *= -z * z / (2 * n);
      const add = term / (2 * n + 1);
      sum += add;
      if (Math.abs(add) <= Number.EPSILON * Math.abs(sum)) break;
    }
    return 0.5 - sum / SQRT2PI;
  }
  return Math.exp(-0.5 * z * z) / SQRT2PI / millsDenominator(z);
}
export function normalLogSf(z:number):number {
  if (Number.isNaN(z)) return NaN;
  if (z === Infinity) return -Infinity;
  if (z === -Infinity) return 0;
  if (z < 0) return Math.log1p(-normalSf(-z));
  if (z < 2) return Math.log(normalSf(z));
  return -0.5 * z * z - Math.log(SQRT2PI) - Math.log(millsDenominator(z));
}
export function normalCdf(z:number):number { return z <= 0 ? normalSf(-z) : 1 - normalSf(z); }
export function inverseNormalSf(q:number):number {
  if (!Number.isFinite(q) || q <= 0 || q >= 1) throw new RangeError('Probability must be between zero and one.');
  if (q === 0.5) return 0;
  if (q > 0.5) return -inverseNormalSf(1 - q);
  const target = Math.log(q);
  let lo = 0, hi = 1;
  while (normalLogSf(hi) > target) hi *= 2;
  for (let i = 0; i < 100; i++) {
    const mid = lo + (hi - lo) / 2;
    if (mid === lo || mid === hi) break;
    if (normalLogSf(mid) > target) lo = mid; else hi = mid;
  }
  return lo + (hi - lo) / 2;
}
export function inverseNormalCdf(p:number):number { return -inverseNormalSf(p); }
