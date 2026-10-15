import {defaults, type Field, type Mode, type Result} from '@/lib/calculators/types';
import {isFieldActive} from '@/lib/calculators/field-visibility';
import {displayField} from '@/lib/calculators/input-display';
import {formatMetric} from '@/lib/calculators/format-metric';
import {parseRows} from '@/lib/calculators/row-data';
import {languages, translator, type Dictionary, type Locale} from '@/lib/i18n/config';
import styles from './worked-example.module.css';

function ExampleRows({field, t}: {field: Field; t: (text: string) => string}) {
  const rows = parseRows(field.default, field.label), columns = field.rowColumns || [];
  if (!rows.length) return t('None');
  return <div className={styles.tableScroll} role="region" aria-label={t(field.label)} tabIndex={0}>
    <table>
      <caption className="sr-only">{t(field.label)}</caption>
      <thead><tr>{columns.map(column => <th key={column.key} scope="col">{t(column.label)}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{columns.map(column => {
        const value = row[column.key];
        const label = column.options?.find(option => option.value === String(value))?.label;
        return <td key={column.key} dir="auto">{value === undefined || value === null || String(value).trim() === ''
          ? <span className={styles.blank}>{t('Not entered')}</span>
          : label ? t(label) : t(String(value))}</td>;
      })}</tr>)}</tbody>
    </table>
  </div>;
}

/** Fixed example with the same input values and engine result in every language. */
export function WorkedExample({mode, result, currency, messages = {}, locale = 'en'}: {
  mode: Mode; result: Result; currency: string; messages?: Dictionary; locale?: Locale;
}) {
  const values = defaults(mode), t = translator(messages);
  return <section id="example">
    <h2>{t('Worked example')}</h2>
    {(result.metrics.some(metric => metric.format === 'money') || mode.fields.some(field => /\$|£|USD|CAD/.test(field.unit || ''))) &&
      <p>{t('Reference example currency: {currency}. These fixed examples do not change with your calculator preferences.', {currency})}</p>}
    <p>{t('Using the {mode} example:', {mode: t(mode.title)})}</p>
    <dl className="worked-inputs">{mode.fields.filter(field => isFieldActive(mode, field, values)).map(field => {
      const displayed = displayField(mode, field, values);
      const options = displayed.options?.filter(option => field.type === 'multiselect'
        ? field.default.split(',').includes(option.value) : option.value === field.default);
      const value = options?.length
        ? options.map(option => displayed.translateOptions === false ? option.label : t(option.label)).join(' · ')
        : field.default ? t(field.default) : t('Not entered');
      return <div key={field.key} className={field.type === 'rows' ? styles.rowGroup : undefined}>
        <dt>{t(displayed.label)}{displayed.unit ? ` (${t(displayed.unit)})` : ''}</dt>
        <dd dir="auto">{field.type === 'rows' ? <ExampleRows field={displayed} t={t}/> : value}</dd>
      </div>;
    })}</dl>
    <h3>{t('Example result')}</h3>
    <div className="example-answer">{result.metrics.map(metric => <p key={metric.label}>
      {t(metric.label)}: <strong dir="auto">{formatMetric({...metric, unit: metric.unit ? t(metric.unit) : undefined}, currency, languages[locale].tag, t)}</strong>
    </p>)}</div>
    {result.explanation && <p>{t(result.explanation)}</p>}
    {!!result.notes?.length && <ul className={styles.notes}>{result.notes.map(note => <li key={note}>{t(note)}</li>)}</ul>}
    <p>{t('These are illustrative inputs. Change the values to explore a different scenario.')}</p>
  </section>;
}
