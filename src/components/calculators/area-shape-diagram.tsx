import styles from './area-shapes.module.css';

const descriptions: Record<string, string> = {
  rectangle: 'Rectangle with dimension arrows for length l and width w',
  square: 'Square with equal-side marks and side length s',
  triangle: 'Triangle with base b, dashed perpendicular height h, and a right-angle marker',
  'triangle-sss': 'Triangle with side a on the right, side b on the left, and base c',
  trapezoid: 'Trapezoid with parallel bases a and b and perpendicular height h',
  circle: 'Circle with radius r measured from the marked center to the edge',
  sector: 'Circular sector with radius r and a central angle marked θ',
  ellipse: 'Ellipse with semi-axis a from center to the right edge and semi-axis b from center to the top',
  parallelogram: 'Parallelogram with base b and perpendicular height h, distinct from its sloping side',
};

// Icons get their own framing so strokes and proportions survive at button size.
const iconFrames: Record<string, string> = {
  rectangle: '28 24 194 110', square: '62 14 136 136',
  triangle: '23 16 207 128', 'triangle-sss': '23 16 207 128',
  trapezoid: '20 33 218 114', parallelogram: '20 28 218 118',
  circle: '60 15 140 140', ellipse: '24 26 212 118',
  sector: '64 15 123 129',
};

function HorizontalDimension({from, to, y, label, labelY}: {from: number; to: number; y: number; label: string; labelY: number}) {
  return <>
    <path className={styles.dimension} d={`M${from} ${y} H${to} M${from + 6} ${y - 4} L${from} ${y} L${from + 6} ${y + 4} M${to - 6} ${y - 4} L${to} ${y} L${to - 6} ${y + 4}`}/>
    <text className={styles.label} x={(from + to) / 2} y={labelY}>{label}</text>
  </>;
}

/** Server-rendered vectors shared by the selector, input guide and formula table. */
export function AreaShapeDiagram({shape, compact = false}: {shape: string; compact?: boolean}) {
  const triangle = shape === 'triangle' || shape === 'triangle-sss';
  return <svg className={styles.diagram} data-compact={compact || undefined}
    viewBox={compact ? iconFrames[shape] : '0 0 260 180'} width="260" height="180"
    role={compact ? undefined : 'img'} aria-label={compact ? undefined : descriptions[shape]}
    aria-hidden={compact || undefined} focusable="false">
    <g className={styles.outline}>
      {shape === 'rectangle' && <rect x="40" y="36" width="170" height="86" rx="2"/>}
      {shape === 'square' && <rect x="75" y="27" width="110" height="110" rx="2"/>}
      {triangle && <path d="M35 132 L218 132 L107 28 Z"/>}
      {shape === 'trapezoid' && <path d="M32 135 L226 135 L180 45 L78 45 Z"/>}
      {shape === 'parallelogram' && <path d="M32 134 L180 134 L226 40 L78 40 Z"/>}
      {shape === 'circle' && <circle cx="130" cy="85" r="58"/>}
      {shape === 'ellipse' && <ellipse cx="130" cy="85" rx="94" ry="47"/>}
      {shape === 'sector' && <path d="M76 132 V27 A105 105 0 0 1 174.67 96.09 Z"/>}
    </g>
    {compact && shape === 'triangle' && <path className={styles.height} d="M107 28 V132"/>}
    {compact && shape === 'triangle-sss' && <g className={styles.point}><circle cx="35" cy="132" r="5"/><circle cx="218" cy="132" r="5"/><circle cx="107" cy="28" r="5"/></g>}
    {!compact && <>
      {shape === 'rectangle' && <>
        <path className={styles.extension} d="M40 128 V153 M210 128 V153 M216 36 H238 M216 122 H238"/>
        <HorizontalDimension from={40} to={210} y={146} label="l" labelY={170}/>
        <path className={styles.dimension} d="M232 36 V122 M228 42 L232 36 L236 42 M228 116 L232 122 L236 116"/>
        <text className={styles.label} x="248" y="86">w</text>
      </>}
      {shape === 'square' && <>
        <path className={styles.measure} d="M130 22 V32 M130 132 V142 M70 82 H80 M180 82 H190"/>
        <path className={styles.extension} d="M75 143 V161 M185 143 V161"/>
        <HorizontalDimension from={75} to={185} y={155} label="s" labelY={177}/>
      </>}
      {['triangle', 'trapezoid', 'parallelogram'].includes(shape) && <>
        <path className={styles.height} d={shape === 'triangle' ? 'M107 28 V132' : shape === 'trapezoid' ? 'M116 45 V135' : 'M96 40 V134'}/>
        <path className={styles.measure} d={shape === 'triangle' ? 'M107 120 H119 V132' : shape === 'trapezoid' ? 'M116 123 H128 V135' : 'M96 122 H108 V134'}/>
        <text className={styles.label} x={shape === 'triangle' ? 126 : shape === 'trapezoid' ? 136 : 116} y="91">h</text>
        <HorizontalDimension from={shape === 'triangle' ? 35 : 32} to={shape === 'triangle' ? 218 : shape === 'trapezoid' ? 226 : 180} y={156} label="b" labelY={178}/>
      </>}
      {shape === 'trapezoid' && <HorizontalDimension from={78} to={180} y={27} label="a" labelY={17}/>}
      {shape === 'triangle-sss' && <>
        <text className={styles.label} x="180" y="75">a</text>
        <text className={styles.label} x="54" y="77">b</text>
        <HorizontalDimension from={35} to={218} y={156} label="c" labelY={178}/>
      </>}
      {shape === 'circle' && <>
        <path className={styles.dimension} d="M130 85 H188 M182 81 L188 85 L182 89"/>
        <circle className={styles.point} cx="130" cy="85" r="3.5"/>
        <text className={styles.label} x="159" y="72">r</text>
      </>}
      {shape === 'ellipse' && <>
        <path className={styles.axis} d="M36 85 H224 M130 38 V132"/>
        <path className={styles.dimension} d="M130 85 H224 M218 81 L224 85 L218 89 M130 85 V38 M126 44 L130 38 L134 44"/>
        <circle className={styles.point} cx="130" cy="85" r="3.5"/>
        <text className={styles.label} x="178" y="108">a</text>
        <text className={styles.label} x="113" y="66">b</text>
      </>}
      {shape === 'sector' && <>
        <path className={styles.angle} d="M76 100 A32 32 0 0 1 106.07 121.06"/>
        <circle className={styles.point} cx="76" cy="132" r="3.5"/>
        <text className={styles.label} x="59" y="82">r</text>
        <text className={styles.label} x="104" y="96">θ</text>
      </>}
    </>}
  </svg>;
}
