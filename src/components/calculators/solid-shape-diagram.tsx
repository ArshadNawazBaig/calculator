import {ContentIllustration} from '@/components/illustrations/content-illustration';
import type {Dictionary} from '@/lib/i18n/config';
import styles from './area-shapes.module.css';

export function SolidShapeDiagram({shape, compact = false, known = 'base-height', messages = {}}: {
  shape: string; compact?: boolean; known?: string; messages?: Dictionary;
}) {
  const variant = shape === 'cap-inverse' ? `${shape}-${known === 'sphere-base' ? 'sphere-base' : 'base-height'}` : shape;
  return <ContentIllustration id={`solid-${variant}${compact ? '-compact' : ''}`} compact={compact} messages={messages} className={styles.diagram}/>;
}
