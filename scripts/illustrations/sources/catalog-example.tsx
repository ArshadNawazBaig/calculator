import type {ReactNode} from 'react';
import type {LucideIcon} from 'lucide-react';
import type {CalculatorExample} from '../../../src/lib/calculator-examples';
import {CalculatorArtwork, calculatorPalettes} from './calculator-artwork';

const palette = calculatorPalettes.math;
const font = 'Arial, DejaVu Sans, sans-serif';

function TileLayout({x, rotated}: {x: number; rotated?: boolean}) {
  const columns = rotated ? [30, 60, 90] : [60];
  const rows = rotated ? [60, 120] : [30, 60, 90, 120];
  return <g transform={`translate(${x} -72) scale(.93)`}>
    <rect width="110" height="150" rx="3" strokeWidth="6"/>
    <g strokeWidth="3" opacity=".8">
      {columns.map(pos => <path key={pos} d={`M${pos} 0v150`}/>)}
      {rows.map(pos => <path key={pos} d={`M0 ${pos}h110`}/>)}
    </g>
    <text x="55" y="182" textAnchor="middle" stroke="none" fill={palette.accent} fontFamily={font} fontSize="24">{rotated ? 'B' : 'A'}</text>
  </g>;
}

// High-contrast silhouettes for examples whose geometry is part of the calculation.
const drawings: Record<string, ReactNode> = {
  'area-calculator': <><rect x="-118" y="-74" width="236" height="148" rx="6"/><rect x="-20" y="-38" width="88.5" height="71" rx="2" strokeDasharray="10 9"/><path d="M24 -36 V31 M-17 -3 H65" strokeWidth="4"/></>,
  'surface-area-calculator': <><ellipse cy="-65" rx="90" ry="28"/><path d="M-90 -65 V65 A90 28 0 0 0 90 65 V-65"/><path d="M-90 65 A90 28 0 0 1 90 65" strokeWidth="4" strokeDasharray="9 8"/></>,
  'circle-calculator': <><circle r="83"/><circle r="55" strokeWidth="6"/><path d="M55 0 H83 M58 -8 L55 0 L58 8 M79 -8 L83 0 L79 8" strokeWidth="4"/></>,
  'pythagorean-theorem-calculator': <><path d="M-96 68 V-76 L96 68 Z"/><path d="M-95 44 H-72 V68" strokeWidth="4"/></>,
  'right-triangle-calculator': <><path d="M-96 68 V-76 L96 68 Z"/><path d="M-96 68 L-27 -24" strokeWidth="5" strokeDasharray="9 8"/><path d="M-95 45 H-72 V68" strokeWidth="4"/></>,
  'slope-calculator': <><path d="M-108 26 H108 L-108 8 Z"/><path d="M-108 48 H108 M-108 42 V54 M108 42 V54" strokeWidth="4"/></>,
  'roofing-calculator': <><path d="M-118 35 L0 -24 L118 35 M-92 24 V78 H92 V24"/><path d="M0 -24 V35 H118" strokeWidth="4" strokeDasharray="8 7"/></>,
  'tile-calculator': <><TileLayout x={-119}/><TileLayout x={17} rotated/></>,
  'square-footage-calculator': <><rect x="-122" y="-48" width="88" height="88" rx="3"/><rect x="-6" y="-4" width="132" height="44" rx="3"/><g strokeWidth="4"><path d="M-122 58h88 M-122 53v10 M-34 53v10 M-6 58h132 M-6 53v10 M126 53v10"/></g></>,
  'concrete-calculator': <><path d="M-110 -23l70 -43 154 33 -66 48z M-110 -23v47L48 62l66 -45v-50 M48 15v47"/><path d="M-110 13L48 50l66 -46" strokeWidth="4" strokeDasharray="8 7"/></>,
  'stair-calculator': <><path d="M-106 69h55V31H4V-7h55v-38h48 M-106 69l213 -114" strokeWidth="8"/><path d="M78 -6v-37m-6 6 6-6 6 6m-12 25 6 6 6-6" strokeWidth="4"/></>,
  'density-calculator': <><path d="M-62 -83v143q0 15 15 15h94q15 0 15-15V-83 M-77 -84H77 M-79 94H79"/><path d="M-59 -8q30 8 59 0t59 0" strokeWidth="6"/><path d="M-61 12H61" strokeDasharray="7 7" strokeWidth="4"/><path d="M37 -48h25m-16 20h16m-25 40h25m-16 20h16m-25 20h25" strokeWidth="4"/></>,
  'triangle-calculator': <><path d="M-95 62 H92 L53 -23 Z"/><path d="M-57 62 Q-57 49 -63 44" strokeWidth="5"/></>,
};

function labelSize(text: string, width: number, max: number) {
  return Math.min(max, width / (Math.max(1, [...text].length) * 0.61));
}

function valueLines(value: string): string[] {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return [value.slice(0, 4), value.slice(5)];
  if (/^[IVXLCDM]+\/[IVXLCDM]+\/[IVXLCDM]+$/.test(value)) {
    const [first, second, year] = value.split('/');
    return [first + '/' + second, year];
  }
  const unit = value.match(/^([+−-]?[\d.]+) (.+)$/);
  return unit ? [unit[1], unit[2]] : [value];
}

function ResultTile({upper, value}: {upper?: boolean; value: string}) {
  const [number, unit] = valueLines(value);
  const ink = upper ? palette.dark : palette.accent;
  const width = upper ? 184 : 161;
  return <g transform={upper ? 'translate(841 191)' : 'translate(962 426)'} fill={ink} textAnchor="middle" fontFamily={font}>
    <circle cy="-46" r="23" fill="none" stroke={ink} strokeWidth="3.8"/>
    <text y="-37" fontWeight="700" fontSize="28">{upper ? 'A' : 'B'}</text>
    <text y={unit ? 23 : 35} fontSize={labelSize(number, width, 61)} fontWeight="700">{number}</text>
    {unit && <text y="62" fontSize={labelSize(unit, width, 34)} fontWeight="600">{unit}</text>}
  </g>;
}

function chartValue(result: string) {
  const match = result.match(/^([+−-]?)((?:CA)?\$|€|£)?(\d+(?:\.\d+)?)\s*([%°×\p{L}²³/·]*)$/u);
  if (!match) return null;
  return {value: Number(match[3]) * (match[1] === '−' || match[1] === '-' ? -1 : 1), unit: (match[2] || '') + match[4]};
}

function ComparisonBars({values}: {values: number[]}) {
  const low = Math.min(0, ...values), high = Math.max(0, ...values);
  const scale = 204 / (high - low);
  const zero = 226 - low * scale;
  return <g>
    <path d={`M${zero} 299 V374`} stroke="#fff" strokeOpacity=".45" strokeWidth="3"/>
    {values.map((value, index) => <g key={index} transform={`translate(0 ${318 + index * 38})`}>
      <text x="195" y="8" fill={palette.accent} textAnchor="middle" fontFamily={font} fontSize="24" fontWeight="700">{index === 0 ? 'A' : 'B'}</text>
      <rect x={Math.min(zero, zero + scale * value)} y="-9" width={Math.abs(scale * value)} height="18" rx="4" fill={palette.accent} fillOpacity={index === 0 ? .66 : 1}/>
    </g>)}
  </g>;
}

export function CatalogExampleArtwork({slug, example, icon: Icon}: {slug: string; example: CalculatorExample; icon: LucideIcon}) {
  const [a, b] = example.rows.map(row => chartValue(row.result));
  const comparable = a && b && a.unit === b.unit && (a.value !== 0 || b.value !== 0);
  const drawing = drawings[slug];
  const primary = <g>
    {drawing ? <g transform="translate(310 283)" fill="none" stroke={palette.accent} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">{drawing}</g>
      : comparable ? <>
        <g transform="translate(254 165)"><Icon size={112} color={palette.accent} strokeWidth={1.35}/></g>
        <ComparisonBars values={[a.value, b.value]}/>
      </> : <g transform="translate(220 168)"><Icon size={180} color={palette.accent} strokeWidth={1.4}/></g>}
    <text x="310" y="431" fill={palette.accent} textAnchor="middle" fontFamily={font} fontWeight="600" fontSize={labelSize(example.notation, 313, 45)}>{example.notation}</text>
  </g>;
  return <CalculatorArtwork palette={palette} primary={primary}
    upper={<ResultTile upper value={example.rows[0].result}/>}
    lower={<ResultTile value={example.rows[1].result}/>}/>;
}
