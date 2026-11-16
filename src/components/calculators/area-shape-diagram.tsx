import {ContentIllustration} from '@/components/illustrations/content-illustration';
import type {Dictionary} from '@/lib/i18n/config';
import styles from './area-shapes.module.css';

/** Crawlable raster artwork shared by selectors, measurement guides and formula tables. */
export function AreaShapeDiagram({shape, compact = false, messages = {}}: {shape: string; compact?: boolean; messages?: Dictionary}) {
  return <ContentIllustration id={`area-${shape}${compact ? '-compact' : ''}`} compact={compact} messages={messages} className={styles.diagram}/>;
}
