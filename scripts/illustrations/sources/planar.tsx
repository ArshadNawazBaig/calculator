import {translator, type Dictionary} from '@/lib/i18n/config';
import type {Values} from '@/lib/calculators/types';
import styles from './drawing-styles';

type PlanarDiagramProps = {slug: string; mode: string; values?: Values; compact?: boolean; messages?: Dictionary};

/** Measurement hints describe the inputs, not a particular numerical solution. */
export function planarMeasurementNote(slug: string, mode: string, values: Values = {}) {
  if (slug === 'circle-calculator') {
    const notes: Record<string, string> = {
      radius: 'Radius r runs from the center to the edge. Use one length unit; the calculated area uses that unit squared.',
      diameter: 'Diameter d passes through the center from edge to edge. It is twice the radius. Use one length unit; area uses its square.',
      circumference: 'Circumference C is the distance around the circle. Enter it in a length unit; the calculated area uses that unit squared.',
      area: 'Area A is the space inside the circle. Enter a square unit, such as cm²; radius, diameter and circumference then use the matching length unit, such as cm.',
    };
    return notes[values.known || 'radius'];
  }
  if (slug === 'triangle-calculator') {
    const notes: Record<string, string> = {
      sss: 'Enter all three sides in the same length unit. Side a is opposite angle A, side b is opposite B, and side c is opposite C. The two shorter sides must add up to more than the longest.',
      sas: 'Enter sides a and b in the same length unit and their included angle C, where those two sides meet. Select degrees or radians for the angle.',
      asa: 'Enter side a, opposite angle A, and angles A and B. Select degrees or radians. The two entered angles must add up to less than 180° (π radians).',
      ssa: 'Enter sides a and b in the same length unit and angle A, opposite side a. This angle is not between the two entered sides. Depending on the values, there may be zero, one or two triangles.',
    };
    return notes[mode];
  }
  if (slug === 'pythagorean-theorem-calculator') {
    return mode === 'leg'
      ? 'Enter hypotenuse c and known leg a in the same length unit. Side c is opposite the right angle and must be longer than a. The calculator finds leg b.'
      : 'Enter perpendicular legs a and b in the same length unit. The calculator finds hypotenuse c, the side opposite the right angle.';
  }
  if (slug === 'right-triangle-calculator') {
    const altitude = values.pair?.split(',').includes('h') ? ' Altitude h runs from the right angle to the hypotenuse at 90°.' : '';
    return mode === 'pair'
      ? `Choose the two measurements you know. All lengths must use the same unit; area uses that unit squared. Angle A is opposite leg a and angle B is opposite leg b. Select degrees or radians for angles.${altitude}`
      : 'Legs a and b meet at the right angle C. Enter both legs in the same length unit; area uses that unit squared. Hypotenuse c is opposite the right angle.';
  }
  return undefined;
}

function CircleDiagram({known, compact}: {known: string; compact: boolean}) {
  return <>
    <g className={styles.outline}><circle cx="130" cy="85" r="58"/></g>
    {known === 'circumference' && <circle className={styles.angle} cx="130" cy="85" r="58"/>}
    {!compact && <>
      {known === 'radius' && <>
        <path className={styles.dimension} d="M130 85 H188 M182 81 L188 85 L182 89"/>
        <circle className={styles.point} cx="130" cy="85" r="3.5"/>
        <text className={styles.label} x="159" y="72">r</text>
      </>}
      {known === 'diameter' && <>
        <path className={styles.dimension} d="M72 85 H188 M78 81 L72 85 L78 89 M182 81 L188 85 L182 89"/>
        <circle className={styles.point} cx="130" cy="85" r="3.5"/>
        <text className={styles.label} x="130" y="72">d</text>
      </>}
      {known === 'circumference' && <>
        <path className={styles.angle} d="M184 79 L188 85 L192 79"/>
        <text className={styles.label} x="209" y="92">C</text>
      </>}
      {known === 'area' && <text className={styles.label} x="130" y="94">A</text>}
    </>}
  </>;
}

function TriangleDiagram({mode, compact}: {mode: string; compact: boolean}) {
  const showA = mode === 'asa' || mode === 'ssa';
  return <>
    <g className={styles.outline}><path d="M32 135 L228 135 L102 30 Z"/></g>
    <g className={styles.angle}>
      {showA && <path d="M62 135 A30 30 0 0 0 48.64 110.04"/>}
      {mode === 'asa' && <path d="M197 135 A31 31 0 0 1 204.19 115.16"/>}
      {mode === 'sas' && <path d="M85.36 54.96 A30 30 0 0 0 125.05 49.21"/>}
    </g>
    {compact && mode === 'sss' && <g className={styles.point}><circle cx="32" cy="135" r="4"/><circle cx="228" cy="135" r="4"/><circle cx="102" cy="30" r="4"/></g>}
    {!compact && <>
      <text className={styles.label} x="20" y="156">A</text>
      <text className={styles.label} x="241" y="156">B</text>
      <text className={styles.label} x="102" y="18">C</text>
      <text className={styles.label} x="181" y="77">a</text>
      <text className={styles.label} x="51" y="77">b</text>
      <text className={styles.label} x="130" y="160">c</text>
    </>}
  </>;
}

function RightTriangleDiagram({mode, values, compact}: {mode: string; values: Values; compact: boolean}) {
  const known = values.pair?.split(',') || [];
  const altitude = mode === 'pair' && known.includes('h');
  return <>
    <g className={styles.outline}><path d="M40 30 V140 H220 Z"/></g>
    <path className={styles.angle} d="M40 126 H54 V140"/>
    {mode === 'pair' && known.includes('A') && <path className={styles.angle} d="M40 61 A31 31 0 0 0 66.45 46.16"/>}
    {mode === 'pair' && known.includes('B') && <path className={styles.angle} d="M185 140 A35 35 0 0 1 190.14 121.75"/>}
    {altitude && <>
      <path className={styles.height} d="M40 140 L88.94 59.91"/>
      {!compact && <>
        <path className={styles.measure} d="M99.18 66.16 L92.93 76.40 L82.68 70.15"/>
        <text className={styles.label} x="83" y="112">h</text>
      </>}
    </>}
    {!compact && <>
      <text className={styles.label} x="40" y="18">A</text>
      <text className={styles.label} x="235" y="155">B</text>
      <text className={styles.label} x="26" y="159">C</text>
      <text className={styles.label} x="130" y="166">a</text>
      <text className={styles.label} x="19" y="88">b</text>
      <text className={styles.label} x="149" y="75">c</text>
    </>}
  </>;
}

/** Native vectors stay visible in server HTML and use no per-instance SVG IDs. */
export function PlanarShapeDiagram({slug, mode, values = {}, compact = false, messages = {}}: PlanarDiagramProps) {
  const t = translator(messages);
  const circle = slug === 'circle-calculator';
  const triangle = slug === 'triangle-calculator';
  const known = values.known || 'radius';
  const circleDescriptions: Record<string, string> = {
    radius: 'Circle with radius r from the center to the edge',
    diameter: 'Circle with diameter d crossing the center from edge to edge',
    circumference: 'Circle with its boundary marked C for circumference',
    area: 'Circle with its interior marked A for area',
  };
  const triangleDescriptions: Record<string, string> = {
    sss: 'Triangle with sides a, b and c opposite vertices A, B and C',
    sas: 'Triangle with included angle C marked between sides a and b',
    asa: 'Triangle with angles A and B marked and side a opposite angle A',
    ssa: 'Triangle with angle A marked opposite side a and not between sides a and b',
  };
  const altitude = mode === 'pair' && values.pair?.split(',').includes('h');
  const description = circle ? circleDescriptions[known] : triangle ? triangleDescriptions[mode]
    : `Right triangle with legs a and b, hypotenuse c, and a right-angle marker at C${altitude ? '; altitude h meets the hypotenuse at a right angle' : ''}`;
  return <svg className={styles.diagram} data-compact={compact || undefined}
    viewBox={compact ? circle ? '60 15 140 140' : triangle ? '22 20 216 125' : '30 20 200 130' : '0 0 260 180'} width="260" height="180"
    role={compact ? undefined : 'img'} aria-label={compact ? undefined : t(description)}
    aria-hidden={compact || undefined} focusable="false">
    {circle ? <CircleDiagram known={known} compact={compact}/>
      : triangle ? <TriangleDiagram mode={mode} compact={compact}/>
        : <RightTriangleDiagram mode={mode} values={values} compact={compact}/>}
  </svg>;
}
