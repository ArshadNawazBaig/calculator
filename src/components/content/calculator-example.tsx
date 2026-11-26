import Image from 'next/image';
import {calculatorExamples, exampleImage} from '@/lib/calculator-examples';
import {translator, type Dictionary, type Locale} from '@/lib/i18n/config';
import {formatExampleResult} from '@/lib/i18n/example-number';
import styles from './calculator-example.module.css';

export function CalculatorExample({slug, nested = false, locale = 'en', messages = {}}: {
  slug: string; nested?: boolean; locale?: Locale; messages?: Dictionary;
}) {
  const example = calculatorExamples[slug];
  if (!example) return null;
  const t = translator(messages), title = t(example.title), headingId = 'illustrated-example-title';
  const Heading = nested ? 'h3' : 'h2';
  const rows = example.rows.map((row, index) => ({
    key: index === 0 ? 'A' : 'B', input: row.label ? t(row.label) : row.input,
    literal: !row.label, work: row.calculation, result: formatExampleResult(row.result, locale),
  }));
  const resultHeading = t(example.resultHeading);
  const alt = resultHeading + '. ' + rows.map(row => `${row.key} (${row.input}) → ${row.result}`).join('. ') + '.';
  const src = exampleImage(slug);
  return <figure className={styles.figure} data-calculator-example={slug} aria-labelledby={headingId}>
    <figcaption><Heading id={headingId}>{title}</Heading></figcaption>
    {example.given && <dl className={styles.givens} aria-label={t('Given')}>
      {example.given.map(({label, value}) => <div key={label}><dt>{t(label)}</dt><dd><bdi dir="ltr">{value}</bdi></dd></div>)}
    </dl>}
    <Image className={styles.image} src={src} overrideSrc={src} width={1200} height={630}
      sizes="auto, (max-width: 720px) calc(100vw - 36px), 680px" loading="lazy" alt={alt}/>
    <div className={styles.scroll} role="region" aria-labelledby={headingId} tabIndex={0}>
      <table className={styles.table}>
        <caption className="sr-only">{title}</caption>
        <thead><tr><th scope="col">{t(example.inputHeading)}</th><th scope="col">{t('Calculation')}</th><th scope="col">{resultHeading}</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.key}>
          <th scope="row"><span className={styles.key}>{row.key}</span>{' '}<bdi dir={row.literal ? 'ltr' : 'auto'}>{row.input}</bdi></th>
          <td><bdi dir="ltr">{row.work}</bdi></td><td><bdi>{row.result}</bdi></td>
        </tr>)}</tbody>
      </table>
    </div>
    {example.note && <p className={styles.note}>{t(example.note)}</p>}
  </figure>;
}
