import Image from 'next/image';
import copy from '@/data/locales/pregnancy-visuals.json';
import type {Locale} from '@/lib/i18n/config';
import styles from './pregnancy-visual.module.css';

/** The bars share an endpoint and illustrate the usual 28-day-cycle convention. */
export function PregnancyVisual({locale = 'en'}: {locale?: Locale}) {
  const text = copy[locale];
  return <section className={styles.section} aria-labelledby="pregnancy-dating-visual-title" data-pregnancy-visual>
    <h2 id="pregnancy-dating-visual-title">{text.title}</h2>
    <Image className={styles.image} src="/illustrations/pregnancy/pregnancy-dating.webp" width={1200} height={675} alt={text.alt} sizes="(max-width: 700px) 100vw, 820px" unoptimized/>
    <figure className={styles.chart}>
      <figcaption className={styles.caption}>{text.example}</figcaption>
      <div className={styles.row}>
        <div className={styles.labels}><span>{text.period}</span><strong>{text.gestation}</strong></div>
        <div className={`${styles.bar} ${styles.gestationalBar}`} aria-hidden="true"/>
      </div>
      <div className={styles.row}>
        <div className={styles.labels}><span>{text.conception}</span><strong>{text.conceptionDuration}</strong></div>
        <div className={`${styles.bar} ${styles.conceptionBar}`} aria-hidden="true"/>
      </div>
      <div className={styles.end}>{text.due}</div>
      <p className={styles.note}>{text.note}</p>
      <a className={styles.source} href="https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date">{text.source}</a>
    </figure>
  </section>;
}
