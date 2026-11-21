import {ArrowUpRight, GraduationCap} from 'lucide-react';
import Link from '@/components/document-link';
import {ToolIcon} from '@/components/ui/tool-icon';
import {studentTools, studentToolHref} from '@/lib/student-tools';
import {localizedPath, translator, type Dictionary, type Locale} from '@/lib/i18n/config';
import styles from './student-tools.module.css';

export function StudentTools({compact = false, currentSlug, locale = 'en', messages = {}}: {compact?: boolean; currentSlug?: string; locale?: Locale; messages?: Dictionary}) {
  const t = translator(messages);
  if (compact) return <section id="student-calculators" className={styles.shortcuts} aria-label={t('Student tools')}>
    <nav aria-label={t('Student calculators')}>
      {studentTools.map(tool => <Link key={tool.slug} href={localizedPath(studentToolHref(tool), locale)} aria-current={tool.slug === currentSlug ? 'page' : undefined}>{t(tool.title)}</Link>)}
    </nav>
    <div className={styles.shortcutLinks}>
      <Link href={localizedPath('/calculators#student-calculators', locale)}>{t('All calculators')}</Link>
      <a href={localizedPath('/grade-calculator#mode-points', locale)}>{t('Calculate a grade from earned and possible points')}</a>
    </div>
  </section>;
  return <section id="student-calculators" className={styles.cluster} aria-labelledby="student-tools-title">
    <div className={styles.heading}>
      <div><span className="eyebrow"><GraduationCap size={17} aria-hidden="true"/> {t('Student tools')}</span><h2 id="student-tools-title">{t('Grades, finals & GPA')}</h2></div>
    </div>
    <p className={styles.intro}>{t('Check where you stand, work out what you need, and plan your next semester.')}</p>
    <nav aria-label={t('Student calculators')} className={styles.grid}>
      {studentTools.map(tool => <Link key={tool.slug} href={localizedPath(studentToolHref(tool), locale)} className={styles.card}>
        <span className={styles.icon}><ToolIcon slug={tool.slug} size={17}/></span>
        <div className={styles.copy}><h3 className={styles.title}>{t(tool.title)}</h3><p className={styles.description}>{t(tool.description)}</p></div>
        <ArrowUpRight className={styles.arrow} size={16} aria-hidden="true"/>
      </Link>)}
    </nav>
    {/* Native navigation emits hashchange when switching modes on the same calculator page. */}
    <p className={styles.points}><a href={localizedPath('/grade-calculator#mode-points', locale)}>{t('Calculate a grade from earned and possible points')}</a></p>
  </section>;
}
