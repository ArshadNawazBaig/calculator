import notes from '@/data/insights/information.json';
import type {Locale} from '@/lib/i18n/config';
import type {Insight} from '@/lib/editorial-insights';
import styles from './explanation.module.css';

export function InformationInsight({slug,locale='en'}: {slug:string;locale?:Locale}) {
  const note=(notes as Record<string,Record<Locale,Insight>>)[slug]?.[locale];
  return note ? <section className={`${styles.panel} ${styles.insight}`} data-information-insight><h2>{note.heading}</h2><p>{note.body}</p></section> : null;
}
