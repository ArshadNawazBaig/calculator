import {calculatorInsights} from '@/lib/editorial-insights';
import {type Locale} from '@/lib/i18n/config';
import copy from '@/data/locales/explanations.json';
import styles from './explanation.module.css';

export function CalculatorInsight({slug, locale = 'en'}: {slug: string; locale?: Locale}) {
  const insight = calculatorInsights[slug]?.[locale];
  if (!insight) return null;
  return <section id="interpretation" className={`${styles.panel} ${styles.insight}`} data-calculator-insight>
    <span className={`eyebrow ${styles.eyebrow}`}>{copy[locale].insight}</span>
    <h2>{insight.heading}</h2><p>{insight.body}</p>
  </section>;
}
