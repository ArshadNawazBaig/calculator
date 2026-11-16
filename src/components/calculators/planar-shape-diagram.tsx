import {ContentIllustration} from '@/components/illustrations/content-illustration';
import type {Dictionary} from '@/lib/i18n/config';
import styles from './area-shapes.module.css';
import type {Values} from '@/lib/calculators/types';

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

export function PlanarShapeDiagram({slug, mode, values = {}, compact = false, messages = {}}: {
  slug: string; mode: string; values?: Values; compact?: boolean; messages?: Dictionary;
}) {
  const pair = mode === 'pair' ? values.pair?.split(',') || [] : [];
  const marks = ['h', 'A', 'B'].filter(mark => pair.includes(mark)).join('-') || 'plain';
  const variant = slug === 'circle-calculator' ? `circle-${values.known || 'radius'}`
    : slug === 'triangle-calculator' ? `triangle-${mode}` : `right-triangle-${marks}`;
  return <ContentIllustration id={`planar-${variant}${compact ? '-compact' : ''}`} compact={compact} messages={messages} className={styles.diagram}/>;
}
