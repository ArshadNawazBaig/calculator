import {num, positive} from './helpers';
import {metric, type Result, type Values} from './types';

const display = (value: number) => String(Number(value.toPrecision(12)));

/** Dimensions have already been converted to the selected result's length unit. */
export function solidGeometry(op: string, values: Values): Result {
  const volume = op.startsWith('volume-');
  const shape = op.slice(volume ? 7 : 13);
  for (const key of Object.keys(values)) positive(num(values, key), key);
  const r = num(values, 'r', 0), r2 = num(values, 'r2', 0), h = num(values, 'h', 0);
  const a = num(values, 'a', 0), b = num(values, 'b', 0), c = num(values, 'c', 0);
  const f = (key: string) => display(num(values, key));
  const pi = Math.PI;
  let V: number, A: number, volumeStep: string, areaStep: string;
  switch (shape) {
    case 'sphere':
      V = 4 * pi / 3 * r ** 3; A = 4 * pi * r * r;
      volumeStep = `4 × π × ${f('r')}³ ÷ 3`; areaStep = `4 × π × ${f('r')}²`; break;
    case 'cone':
      V = pi / 3 * r * r * h; A = pi * r * (r + Math.hypot(r, h));
      volumeStep = `π × ${f('r')}² × ${f('h')} ÷ 3`;
      areaStep = `π × ${f('r')} × (${f('r')} + √[${f('r')}² + ${f('h')}²])`; break;
    case 'cube':
      V = a ** 3; A = 6 * a * a;
      volumeStep = `${f('a')}³`; areaStep = `6 × ${f('a')}²`; break;
    case 'cylinder':
      V = pi * r * r * h; A = 2 * pi * r * (r + h);
      volumeStep = `π × ${f('r')}² × ${f('h')}`; areaStep = `2 × π × ${f('r')} × (${f('r')} + ${f('h')})`; break;
    case 'cuboid':
      V = a * b * h; A = 2 * (a * b + a * h + b * h);
      volumeStep = `${f('a')} × ${f('b')} × ${f('h')}`;
      areaStep = `2 × (${f('a')} × ${f('b')} + ${f('a')} × ${f('h')} + ${f('b')} × ${f('h')})`; break;
    case 'capsule':
      V = pi * r * r * h + 4 * pi / 3 * r ** 3; A = 2 * pi * r * h + 4 * pi * r * r;
      volumeStep = `π × ${f('r')}² × ${f('h')} + 4 × π × ${f('r')}³ ÷ 3`;
      areaStep = `2 × π × ${f('r')} × ${f('h')} + 4 × π × ${f('r')}²`; break;
    case 'cap':
      if (h > 2 * r) throw Error('Cap height cannot exceed the sphere diameter.');
      V = pi / 3 * h * h * (3 * r - h); A = 2 * pi * r * h + pi * h * (2 * r - h);
      volumeStep = `π × ${f('h')}² × (3 × ${f('r')} − ${f('h')}) ÷ 3`;
      areaStep = `2 × π × ${f('r')} × ${f('h')} + π × ${f('h')} × (2 × ${f('r')} − ${f('h')})`; break;
    case 'frustum':
      V = pi / 3 * h * (r * r + r * r2 + r2 * r2);
      A = pi * (r + r2) * Math.hypot(r - r2, h) + pi * (r * r + r2 * r2);
      volumeStep = `π × ${f('h')} × (${f('r')}² + ${f('r')} × ${f('r2')} + ${f('r2')}²) ÷ 3`;
      areaStep = `π × (${f('r')} + ${f('r2')}) × √[(${f('r')} − ${f('r2')})² + ${f('h')}²] + π × (${f('r')}² + ${f('r2')}²)`; break;
    case 'ellipsoid': {
      V = 4 * pi / 3 * a * b * c;
      // Normalize before fractional powers to avoid avoidable intermediate overflow.
      const scale = Math.max(a, b, c), x = a / scale, y = b / scale, z = c / scale, p = 1.6075;
      A = 4 * pi * (((x * y) ** p + (x * z) ** p + (y * z) ** p) / 3) ** (1 / p) * scale * scale;
      volumeStep = `4 × π × ${f('a')} × ${f('b')} × ${f('c')} ÷ 3`;
      areaStep = `4 × π × [((${f('a')} × ${f('b')})^p + (${f('a')} × ${f('c')})^p + (${f('b')} × ${f('c')})^p) ÷ 3]^(1/p)`; break;
    }
    case 'pyramid':
      V = a * b * h / 3; A = a * b + a * Math.hypot(b / 2, h) + b * Math.hypot(a / 2, h);
      volumeStep = `${f('a')} × ${f('b')} × ${f('h')} ÷ 3`;
      areaStep = `${f('a')} × ${f('b')} + ${f('a')} × √[(${f('b')} ÷ 2)² + ${f('h')}²] + ${f('b')} × √[(${f('a')} ÷ 2)² + ${f('h')}²]`; break;
    case 'tube': {
      if (r2 >= r) throw Error('Inner radius must be smaller than outer radius.');
      const ring = (r - r2) * (r + r2);
      V = pi * ring * h; A = 2 * pi * (r + r2) * h + 2 * pi * ring;
      volumeStep = `π × (${f('r')}² − ${f('r2')}²) × ${f('h')}`;
      areaStep = `2 × π × (${f('r')} + ${f('r2')}) × ${f('h')} + 2 × π × (${f('r')}² − ${f('r2')}²)`; break;
    }
    default: throw Error('Select a supported solid shape.');
  }
  const value = volume ? V : A, unit = volume ? 'cubic units' : 'square units';
  if (!Number.isFinite(value) || value <= 0) throw Error('These dimensions exceed the supported numeric range. Choose different units or dimensions.');
  return {
    metrics: [metric(volume ? 'Volume' : 'Surface area', value, 'number', unit)],
    explanation: `${volume ? 'V' : 'A'} ${!volume && shape === 'ellipsoid' ? '≈' : '='} ${volume ? volumeStep : areaStep} = ${display(value)} ${unit}.${!volume && shape === 'ellipsoid' ? ' Here p = 1.6075.' : ''}`,
  };
}
