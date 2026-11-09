import Link from '@/components/document-link';
import {localizedPath, translator, type Dictionary, type Locale} from '@/lib/i18n/config';
import styles from './explanation.module.css';

/** Interpretation help for the adult screening page; no individual weight targets. */
export function AdultBmiScreening({messages = {}, locale = 'en'}: {messages?: Dictionary; locale?: Locale}) {
  const t = translator(messages);
  const categories = [
    ['Underweight', 'Below 18.5'],
    ['Healthy-weight range', '18.5 to below 25'],
    ['Overweight', '25 to below 30'],
    ['Obesity range', '30 and above'],
  ];
  return <section id="adult-screening-guide" className={styles.panel} aria-labelledby="adult-screening-heading">
    <h2 id="adult-screening-heading">{t('Read an adult BMI category in three steps')}</h2>
    <h3>{t('1. Choose the reference for the person’s age')}</h3>
    <p>{t('This page applies adult categories from age 20. For ages 2 through 19, use sex-specific BMI-for-age percentiles instead of adult cutoffs. Changing the adult age input does not turn an adult category into a child percentile.')}</p>
    <nav className={styles.methodLinks} aria-label={t('Choose an age-appropriate BMI method')}>
      <Link href="#mode-adult">{t('Adult screening: age 20 and older')}</Link>
      <Link href={localizedPath('/bmi-calculator#mode-child', locale)}>{t('Child and teen BMI-for-age: ages 2–19')}</Link>
    </nav>
    <h3>{t('2. Read the boundary before interpreting the label')}</h3>
    <p>{t('The category uses the BMI calculated from your entries before display rounding. An exact BMI of 25 belongs to the 25-to-below-30 interval; 30 belongs to the interval beginning at 30. These are screening boundaries, not a diagnosis or personal goals.')}</p>
    <div className={styles.scroll} role="region" aria-label={t('Adult BMI category reference')} tabIndex={0}>
      <table className={styles.table}>
        <caption>{t('CDC adult screening categories, age 20 and older')}</caption>
        <thead><tr><th scope="col">{t('Screening category')}</th><th scope="col">{t('BMI interval (kg/m²)')}</th></tr></thead>
        <tbody>{categories.map(([category, interval]) => <tr key={category}><th scope="row">{t(category)}</th><td>{t(interval)}</td></tr>)}</tbody>
      </table>
    </div>
    <h3>{t('3. Check why a rounded number can look inconsistent')}</h3>
    <p>{t('In this arithmetic example, height stays at 175 cm, so height squared is 1.75² = 3.0625 m². Dividing 76.56 kg by 3.0625 gives about 24.99918; dividing 76.5625 kg by the same value gives exactly 25. Both display as 25 with at most two decimal places, while the unrounded values fall in different intervals.')}</p>
    <div className={styles.scroll} role="region" aria-label={t('BMI rounding example')} tabIndex={0}>
      <table className={styles.table}>
        <caption>{t('A fixed numerical example at 175 cm, not recommended weights')}</caption>
        <thead><tr><th scope="col">{t('Example input')}</th><th scope="col">{t('BMI before display rounding')}</th><th scope="col">{t('Screening category')}</th></tr></thead>
        <tbody>
          <tr><th scope="row">76.56 kg</th><td>24.999183…</td><td>{t('Healthy-weight range')}</td></tr>
          <tr><th scope="row">76.5625 kg</th><td>25</td><td>{t('Overweight')}</td></tr>
        </tbody>
      </table>
    </div>
    <p>{t('The extra decimal places demonstrate the arithmetic; they do not make a scale or height measurement that precise. Check units and measurement accuracy when a result is close to a boundary. A small category change alone cannot establish a sudden change in health. BMI also does not distinguish muscle from fat, and a healthcare professional can consider other information with the result.')}</p>
    <p><Link href={localizedPath('/guides/bmi-as-a-screening-tool', locale)}>{t('Read what adult BMI can and cannot tell you')}</Link>{' · '}<a href="https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html" target="_blank" rel="noreferrer">{t('CDC adult category reference')}<span className="sr-only"> {t('(opens in a new tab)')}</span></a>{' · '}<a href="https://www.cdc.gov/bmi/child-teen-calculator/bmi-categories.html" target="_blank" rel="noreferrer">{t('CDC child and teen reference')}<span className="sr-only"> {t('(opens in a new tab)')}</span></a></p>
  </section>;
}
