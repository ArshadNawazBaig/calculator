import {ArrowUpRight, GraduationCap} from 'lucide-react';
import Link from 'next/link';
import {studentTools, studentToolHref} from '@/lib/student-tools';
import {localizedPath, translator, type Dictionary, type Locale} from '@/lib/i18n/config';
import styles from './student-tools.module.css';

export function StudentTools({compact = false, locale = 'en', messages = {}}: {compact?: boolean; locale?: Locale; messages?: Dictionary}) {
  const t = translator(messages);
  return <section id="student-calculators" className={styles.cluster} aria-labelledby="student-tools-title">
    <div className={styles.heading}>
      <div><span className="eyebrow"><GraduationCap size={17} aria-hidden="true"/> {t('Student tools')}</span><h2 id="student-tools-title">{t('Grades, finals & GPA')}</h2></div>
      {compact && <Link className="text-link" href={localizedPath('/calculators#student-calculators', locale)}>{t('All calculators')}</Link>}
    </div>
    {!compact && <p className={styles.intro}>{t('Check where you stand, work out what you need, and plan your next semester.')}</p>}
    <nav aria-label={t('Student calculators')} className={compact ? styles.compact : styles.grid}>
      {studentTools.map(tool => <Link key={tool.slug} href={localizedPath(studentToolHref(tool), locale)} className={styles.card}>
        <h3 className={styles.title}>{t(tool.title)}<ArrowUpRight size={17} aria-hidden="true"/></h3>
        <p className={styles.description}>{t(tool.description)}</p>
      </Link>)}
    </nav>
    {/* Native navigation emits hashchange when switching modes on the same calculator page. */}
    <p className={styles.points}><a href={localizedPath('/grade-calculator#mode-points', locale)}>{t('Calculate a grade from earned and possible points')}</a></p>
  </section>;
}
