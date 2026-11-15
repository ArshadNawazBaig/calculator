import type {Mode} from '@/lib/calculators/types';
import {useI18n} from '@/components/i18n/provider';
import styles from './input-guide.module.css';

/** Keep the selected method's assumptions beside the inputs, including in server HTML. */
export function InputGuide({mode}: {mode: Mode}) {
  const {t} = useI18n();
  return <details key={mode.id} className={styles.guide} data-input-guide>
    <summary>{t('Formula and input guidance')}</summary>
    <div>
      <p className={styles.title}>{t(mode.title)}</p>
      <p className={styles.formula} dir="auto">{t(mode.formula)}</p>
      <p>{t(mode.explanation)}</p>
      {!!mode.notes?.length && <ul>{mode.notes.map(note => <li key={note}>{t(note)}</li>)}</ul>}
    </div>
  </details>;
}
