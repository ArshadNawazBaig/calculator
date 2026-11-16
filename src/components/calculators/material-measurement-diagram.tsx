import {translator, type Dictionary} from '@/lib/i18n/config';
import type {ReactNode} from 'react';
import type {Mode, Values} from '@/lib/calculators/types';
import styles from './area-shapes.module.css';

type Props = {slug: string; mode: Mode; values: Values};
type Measurement = {shape: string; description: string; formula: string; hint: string; labels?: string[]};

/** Use the active geometry, including shape selectors within a mode. */
export function materialMeasurement({slug, mode, values}: Props): Measurement | undefined {
  const algorithm = mode.algorithm;
  if (slug === 'square-footage-calculator') {
    const shape = algorithm === 'floor-area' ? 'rectangle' : algorithm === 'floor-circle' ? 'circle' : values.shape;
    const legacy = algorithm === 'floor-shapes';
    const common = 'Multiply the area of one shape by the number of identical areas.';
    const l = legacy ? 'a' : 'L', w = legacy ? 'b' : 'W', border = legacy ? 'c' : 't';
    const entries: Record<string, Measurement> = {
      rectangle: {shape, description: 'Rectangle with length L and width W', labels: ['L', 'W'], formula: 'A = L × W × quantity', hint: `Measure two sides meeting at a right angle. ${common}`},
      circle: {shape, description: 'Circular floor with diameter d through its center', labels: ['d'], formula: 'A = π × (d / 2)² × quantity', hint: `Enter diameter, measured across the center from edge to edge. ${common}`},
      border: {shape, description: `Rectangular border with outer dimensions ${l} and ${w}, and inward width ${border}`, labels: [l, w, border], formula: `A = [${l}${w} − (${l} − 2${border})(${w} − 2${border})] × quantity`, hint: 'Measure the outside rectangle and the uniform inward border. The result covers the border only, excluding the center.'},
      ring: {shape, description: 'Circular border with outer diameter and inward radial width', labels: [legacy ? 'a' : 'd', legacy ? 'b' : 't'], formula: `A = π × [(${legacy ? 'a' : 'd'} / 2)² − (${legacy ? 'a' : 'd'} / 2 − ${legacy ? 'b' : 't'})²] × quantity`, hint: 'The diameter spans the outside circle. Border width is the inward distance from its outer edge to its inner edge, not the inner diameter.'},
      triangle: {shape, description: 'Triangle with three measured sides a, b, and c', labels: ['a', 'b', 'c'], formula: 's = (a + b + c) / 2; A = √[s(s − a)(s − b)(s − c)] × quantity', hint: 'Enter all three sides. The two shorter sides must add up to more than the longest side.'},
      'base-height': {shape, description: 'Triangle with base a and perpendicular height b', labels: ['a', 'b'], formula: 'A = a × b / 2 × quantity', hint: 'Enter the base in the first dimension field and its perpendicular height in the second. The sloping side is not the height.'},
      trapezoid: {shape, description: `Trapezoid with parallel bases a and b and perpendicular height ${legacy ? 'c' : 'h'}`, labels: ['a', 'b', legacy ? 'c' : 'h'], formula: `A = (a + b) × ${legacy ? 'c' : 'h'} / 2 × quantity`, hint: 'The first two dimensions are the parallel bases. Measure height at a right angle between them, not along a sloping side.'},
      sector: {shape, description: `Circular sector with radius ${legacy ? 'a' : 'r'} and central angle θ`, labels: [legacy ? 'a' : 'r', 'θ'], formula: `A = π × ${legacy ? 'a' : 'r'}² × θ / 360 × quantity`, hint: 'Measure radius from the center to the curved edge and enter the central angle in degrees.'},
      parallelogram: {shape, description: 'Parallelogram with base a and perpendicular height b', labels: ['a', 'b'], formula: 'A = a × b × quantity', hint: 'Enter the base in the first dimension field and its perpendicular height in the second. Do not use the sloping edge as the height.'},
    };
    return entries[shape];
  }
  if (slug === 'concrete-calculator') {
    const shape = algorithm === 'concrete-measured' ? values.shape : mode.id;
    const quantity = mode.fields.some(field => field.key === 'quantity') ? ' × quantity' : '';
    if (shape === 'slab') return {shape: 'slab', description: 'Rectangular slab with length L, width W, and thickness t', labels: ['L', 'W', 't'], formula: `Net volume = L × W × t${quantity}`, hint: 'Thickness is measured perpendicular to the slab face. Convert dimensions to compatible units before multiplying; the selected allowance is added after net volume.'};
    if (shape === 'column' || shape === 'tube') return {shape, description: shape === 'column' ? 'Round column with diameter d and height h' : 'Hollow column with outer diameter D, inner diameter d, and height h', labels: shape === 'column' ? ['d', 'h'] : ['D', 'd', 'h'], formula: shape === 'column' ? 'Net volume = π × (d / 2)² × h × quantity' : 'Net volume = π × [(D / 2)² − (d / 2)²] × h × quantity', hint: shape === 'column' ? 'Enter the diameter across the circular face, not its radius. Height runs along the column. The formula uses compatible length units; the calculator converts the labeled inputs.' : 'Enter outer and inner diameters, not radii, and the height along the column. The inner diameter must be smaller. The result measures material around the opening; the calculator converts the labeled units.'};
    return undefined;
  }
  if (slug === 'mulch-calculator' || slug === 'gravel-calculator') {
    const shape = algorithm === 'landscape' ? 'rectangle' : algorithm === 'gravel-circle' ? 'circle' : algorithm === 'landscape-purchasing' ? values.shape : undefined;
    if (shape === 'rectangle') return {shape: 'slab', description: 'Rectangular material bed with length L, width W, and depth t', labels: ['L', 'W', 't'], formula: 'Net volume = L × W × t', hint: 'Measure the bed footprint and the intended uniform material depth. Depth often uses inches while length and width use feet; check every unit. Any selected allowance is added afterward.'};
    if (shape === 'circle') return {shape: 'column', description: 'Circular material bed with diameter d and depth h', labels: ['d', 'h'], formula: 'Net volume = π × (d / 2)² × h', hint: 'Diameter crosses the circular bed through its center; h represents material depth. The proportions are illustrative. Weight additionally depends on the entered bulk density.'};
    return undefined;
  }
  if (slug === 'roofing-calculator' && ['roof', 'roof-measured'].includes(algorithm)) {
    const angle = algorithm === 'roof-measured' && values.slopeInput === 'degrees';
    return {shape: angle ? 'roof-angle' : 'roof-pitch', description: angle ? 'Roof slope angle θ above the horizontal footprint' : 'Roof cross-section showing vertical rise p for 12 units of horizontal run', labels: angle ? ['θ'] : ['12', 'p'], formula: angle ? 'Roof surface = horizontal area / cos(θ)' : 'Roof surface = horizontal area × √[1 + (p / 12)²]', hint: 'The footprint is measured horizontally; roof surface follows the slope. Include overhangs once. Use separate sections for different slopes, and add any allowance after computing surface area.'};
  }
  if (slug === 'stair-calculator' && ['stairs', 'stairs-rise-run'].includes(algorithm)) return {shape: 'stairs', description: 'Illustrative straight stair with total rise H, total run R, individual riser h, and tread run t', labels: ['H', 'R', 'h', 't'], formula: 'Riser height = total rise / risers; total run = tread run × (risers − 1)', hint: 'Measure total rise between finished floors and run horizontally. The standard layout uses one fewer tread than risers. The drawing does not specify a structural or code-compliant design.'};
  if (slug === 'tile-calculator' && (algorithm === 'tile' || algorithm === 'tile-procurement' && values.areaInput === 'room-dimensions')) return {shape: 'tiles', description: 'Rectangular room with length L and width W, beside one tile with dimensions l and w', labels: ['L', 'W', 'l', 'w'], formula: 'Room area = L × W; tile area = l × w', hint: 'Measure room and tile dimensions in their stated units. Basic area mode divides room area by tile area; procurement can also use grout joints, a grid, allowance, and whole-box rounding.'};
  return undefined;
}

export function hasMaterialMeasurementGuide(slug: string, mode: Mode, values: Values) {
  return Boolean(materialMeasurement({slug, mode, values}));
}

function Dimension({x1, y1, x2, y2, label, x, y}: {x1: number; y1: number; x2: number; y2: number; label: string; x: number; y: number}) {
  const length = Math.hypot(x2 - x1, y2 - y1), dx = (x2 - x1) / length, dy = (y2 - y1) / length;
  const arrow = (px: number, py: number, sign: number) => `M${px + sign * 6 * dx - 4 * dy} ${py + sign * 6 * dy + 4 * dx} L${px} ${py} L${px + sign * 6 * dx + 4 * dy} ${py + sign * 6 * dy - 4 * dx}`;
  return <><path className={styles.dimension} d={`M${x1} ${y1} L${x2} ${y2} ${arrow(x1, y1, 1)} ${arrow(x2, y2, -1)}`}/><text className={styles.label} x={x} y={y}>{label}</text></>;
}

function Diagram({measurement}: {measurement: Measurement}) {
  const {shape, labels: labels = []} = measurement;
  return <svg className={styles.diagram} viewBox="0 0 260 180" width="260" height="180" role="img" aria-label={measurement.description} focusable="false">
    {(shape === 'rectangle' || shape === 'border') && <>
      <g className={styles.outline}><rect x="40" y="35" width="165" height="95"/>{shape === 'border' && <rect x="63" y="58" width="119" height="49" fill="var(--color-surface)"/>}</g>
      <Dimension x1={40} y1={150} x2={205} y2={150} label={labels[0]} x={122} y={173}/>
      <Dimension x1={227} y1={35} x2={227} y2={130} label={labels[1]} x={244} y={88}/>
      {shape === 'border' && <Dimension x1={40} y1={80} x2={63} y2={80} label={labels[2]} x={51} y={68}/>}
    </>}
    {(shape === 'circle' || shape === 'ring') && <>
      <g className={styles.outline}><circle cx="125" cy="85" r="58"/>{shape === 'ring' && <circle cx="125" cy="85" r="33" fill="var(--color-surface)"/>}</g>
      <Dimension x1={67} y1={85} x2={183} y2={85} label={labels[0]} x={125} y={75}/>
      {shape === 'ring' && <Dimension x1={148.33} y1={108.33} x2={166.01} y2={126.01} label={labels[1]} x={191} y={145}/>}
    </>}
    {(shape === 'triangle' || shape === 'base-height') && <>
      <g className={styles.outline}><path d="M34 134 H223 L109 30 Z"/></g>
      {shape === 'triangle' ? <>
        <text className={styles.label} x="183" y="75">{labels[0]}</text><text className={styles.label} x="54" y="77">{labels[1]}</text><text className={styles.label} x="127" y="159">{labels[2]}</text>
      </> : <>
        <path className={styles.height} d="M109 30 V134"/><path className={styles.measure} d="M109 122 H121 V134"/>
        <text className={styles.label} x="129" y="87">{labels[1]}</text><Dimension x1={34} y1={151} x2={223} y2={151} label={labels[0]} x={129} y={174}/>
      </>}
    </>}
    {(shape === 'trapezoid' || shape === 'parallelogram') && <>
      <g className={styles.outline}><path d={shape === 'trapezoid' ? 'M32 132 H226 L180 45 H78 Z' : 'M32 132 H181 L226 40 H77 Z'}/></g>
      <path className={styles.height} d={`M110 ${shape === 'trapezoid' ? 45 : 40} V132`}/><path className={styles.measure} d="M110 120 H122 V132"/>
      <text className={styles.label} x="131" y="91">{shape === 'trapezoid' ? labels[2] : labels[1]}</text>
      <Dimension x1={32} y1={152} x2={shape === 'trapezoid' ? 226 : 181} y2={152} label={shape === 'trapezoid' ? labels[1] : labels[0]} x={shape === 'trapezoid' ? 129 : 106} y={175}/>
      {shape === 'trapezoid' && <Dimension x1={78} y1={27} x2={180} y2={27} label={labels[0]} x={129} y={22}/>}
    </>}
    {shape === 'sector' && <>
      <g className={styles.outline}><path d="M76 132 V27 A105 105 0 0 1 174.67 96.09 Z"/></g><path className={styles.angle} d="M76 100 A32 32 0 0 1 106.07 121.06"/>
      <text className={styles.label} x="58" y="82">{labels[0]}</text><text className={styles.label} x="105" y="95">{labels[1]}</text>
    </>}
    {shape === 'slab' && <>
      <g className={styles.outline}><path d="M43 78 L98 36 H211 V105 L156 147 H43 Z"/><path d="M43 78 H156 V147 M156 78 L211 36" fill="none"/></g>
      <Dimension x1={43} y1={158} x2={156} y2={158} label={labels[0]} x={100} y={174}/>
      <Dimension x1={170} y1={153} x2={226} y2={110} label={labels[1]} x={220} y={148}/>
      <Dimension x1={25} y1={78} x2={25} y2={147} label={labels[2]} x={12} y={118}/>
    </>}
    {(shape === 'column' || shape === 'tube') && <>
      <g className={styles.outline}><path d="M65 45 V135 A65 19 0 0 0 195 135 V45 Z"/><ellipse cx="130" cy="45" rx="65" ry="19"/>{shape === 'tube' && <ellipse cx="130" cy="45" rx="34" ry="10" fill="var(--color-surface)"/>}</g>
      <path className={styles.height} d="M65 135 A65 19 0 0 1 195 135"/>
      <Dimension x1={65} y1={45} x2={195} y2={45} label={labels[0]} x={130} y={22}/>
      {shape === 'tube' && <><path className={styles.height} d="M96 45 V135 M164 45 V135"/><Dimension x1={96} y1={78} x2={164} y2={78} label={labels[1]} x={130} y={103}/></>}
      <Dimension x1={219} y1={45} x2={219} y2={135} label={shape === 'column' ? labels[1] : labels[2]} x={238} y={96}/>
    </>}
    {(shape === 'roof-pitch' || shape === 'roof-angle') && <>
      <g className={styles.outline}><path d="M42 132 L208 42 V132 Z"/></g><path className={styles.measure} d="M196 132 V120 H208"/>
      {shape === 'roof-pitch' ? <><Dimension x1={42} y1={152} x2={208} y2={152} label="12" x={125} y={174}/><Dimension x1={226} y1={42} x2={226} y2={132} label="p" x={243} y={93}/></> : <><path className={styles.angle} d="M82 132 A40 40 0 0 0 77.17 112.93"/><text className={styles.label} x="100" y="118">θ</text></>}
    </>}
    {shape === 'stairs' && <>
      <g className={styles.outline}><path d="M45 138 V113 H86 V88 H127 V63 H168 V38 H209 V138 Z"/></g>
      <Dimension x1={25} y1={38} x2={25} y2={138} label="H" x={12} y={95}/><Dimension x1={45} y1={155} x2={168} y2={155} label="R" x={106} y={174}/>
      <Dimension x1={86} y1={75} x2={127} y2={75} label="t" x={107} y={64}/><Dimension x1={61} y1={113} x2={61} y2={138} label="h" x={79} y={133}/>
      <path className={styles.height} d="M168 38 V148"/>
    </>}
    {shape === 'tiles' && <>
      <g className={styles.outline}><rect x="45" y="35" width="112" height="90"/><rect x="193" y="62" width="40" height="40"/></g>
      <Dimension x1={45} y1={144} x2={157} y2={144} label="L" x={94} y={167}/><Dimension x1={30} y1={35} x2={30} y2={125} label="W" x={14} y={86}/>
      <Dimension x1={193} y1={120} x2={233} y2={120} label="l" x={213} y={144}/><text className={styles.label} x="246" y="89">w</text>
    </>}
  </svg>;
}

/** A selected-shape guide; unsupported geometries use the shared textual help. */
export function MaterialMeasurementDiagram(props: Props & {fallback?: ReactNode; messages?: Dictionary}) {
  const t = translator(props.messages || {});
  const measurement = materialMeasurement(props);
  if (!measurement) return props.fallback ?? null;
  return <figure className={styles.measurement} data-input-guide>
    <Diagram measurement={{...measurement, description:t(measurement.description)}}/>
    <figcaption><strong>{t(measurement.formula)}</strong><small>{t('Diagram is not to scale.')}</small></figcaption>
    <details><summary>{t('Which measurements do I need?')}</summary><p>{t(measurement.hint)}</p></details>
  </figure>;
}
