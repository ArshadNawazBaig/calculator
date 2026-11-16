import {ContentIllustration} from '@/components/illustrations/content-illustration';
import {materialIllustrationId} from '@/lib/illustration-id';
import {translator, type Dictionary} from '@/lib/i18n/config';
import type {ReactNode} from 'react';
import type {Mode, Values} from '@/lib/calculators/types';
import styles from './area-shapes.module.css';

type Props = {slug: string; mode: Mode; values: Values};
export type Measurement = {shape: string; description: string; formula: string; hint: string; labels?: string[]};

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

/** A selected-shape guide; unsupported geometries use the shared textual help. */
export function MaterialMeasurementDiagram(props: Props & {fallback?: ReactNode; messages?: Dictionary}) {
  const t = translator(props.messages || {});
  const measurement = materialMeasurement(props);
  if (!measurement) return props.fallback ?? null;
  return <figure className={styles.measurement} data-input-guide>
    <ContentIllustration id={materialIllustrationId(measurement)} alt={t(measurement.description)} className={styles.diagram}/>
    <figcaption><strong>{t(measurement.formula)}</strong><small>{t('Diagram is not to scale.')}</small></figcaption>
    <details><summary>{t('Which measurements do I need?')}</summary><p>{t(measurement.hint)}</p></details>
  </figure>;
}
