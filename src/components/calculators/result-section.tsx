import type {ReactNode} from 'react';
import styles from './result-section.module.css';

/** Shared shell for calculator breakdowns, documents, and saved results. */
export function ResultSection({id, titleId, title, icon, action, description, hint, children}: {
  id?: string; titleId: string; title: ReactNode; icon: ReactNode; action?: ReactNode;
  description?: ReactNode; hint?: ReactNode; children: ReactNode;
}) {
  return <section id={id} className={`result-details ${styles.section}`} aria-labelledby={titleId}>
    <div className={styles.heading}>
      <div className={styles.title}>{icon}<h2 id={titleId}>{title}</h2></div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
    {(description || hint) && <div className={styles.meta}>{description && <p>{description}</p>}{hint && <span>{hint}</span>}</div>}
    {children}
  </section>;
}
