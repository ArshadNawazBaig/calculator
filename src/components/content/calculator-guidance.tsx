import content from '@/data/calculator-content.json';
import {localizedPath, translator, type Dictionary, type Locale} from '@/lib/i18n/config';
import {formatExampleResult} from '@/lib/i18n/example-number';
import styles from './explanation.module.css';

export type GuidanceSection = {
  id?: string;
  aliasIds?: string[];
  title: string;
  paragraphs: string[];
  table?: {caption: string; headers: string[]; rows: string[][]; literalColumns?: number[]; numberColumns?: number[]};
  links?: {label: string; href: string}[];
};

function guidanceCell(table: NonNullable<GuidanceSection['table']>, cell: string, column: number, locale: Locale, t: (text: string) => string) {
  if (table.literalColumns?.includes(column)) return <bdi dir="ltr">{cell}</bdi>;
  // Only the designated quantity columns contain display arithmetic. Dates, input samples
  // and prose keep their original representation or their dictionary translation.
  if (table.numberColumns?.includes(column) && /^[\d,.]+(?: [+−×÷] [\d,.]+)*$/.test(cell)) {
    return <bdi dir="ltr">{cell.replace(/[\d,.]+/g, value => formatExampleResult(value, locale))}</bdi>;
  }
  return t(cell);
}

/** Server-rendered topic guidance, shared by English and translated articles. */
export function CalculatorGuidance({slug, messages = {}, contents = false, locale = 'en'}: {slug: string; messages?: Dictionary; contents?: boolean; locale?: Locale}) {
  const t = translator(messages);
  const entry = (content as Record<string, {sections: GuidanceSection[]}>)[slug];
  if (!entry) return null;
  return <>
    {contents && entry.sections.length >= 3 && <nav className={styles.guideContents} aria-label={t('In this guide')} data-calculator-guide-nav>
      <h2>{t('In this guide')}</h2>
      <ul>{entry.sections.map((section, index) => <li key={section.title}><a href={`#${section.id || `understanding-${index + 1}`}`}>{t(section.title)}</a></li>)}</ul>
    </nav>}
    {entry.sections.map((section, index) => <section key={section.title} id={section.id || `understanding-${index + 1}`}>
    {section.aliasIds?.map(id => <span key={id} id={id} aria-hidden="true"/>)}
    <h2>{t(section.title)}</h2>
    {section.paragraphs.map(paragraph => <p key={paragraph}>{t(paragraph)}</p>)}
    {section.table && <div className={styles.scroll} role="region" aria-label={t(section.table.caption)} tabIndex={0}>
      <table className={styles.table}>
        <caption>{t(section.table.caption)}</caption>
        <thead><tr>{section.table.headers.map(header => <th key={header} scope="col">{t(header)}</th>)}</tr></thead>
        <tbody>{section.table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, columnIndex) => {
          const value = guidanceCell(section.table!, cell, columnIndex, locale, t);
          return columnIndex === 0 ? <th key={columnIndex} scope="row">{value}</th> : <td key={columnIndex}>{value}</td>;
        })}</tr>)}</tbody>
      </table>
    </div>}
    {!!section.links?.length && <nav className={styles.methodLinks} aria-label={t(section.title)}>
      {section.links.map(link => <a key={link.href} href={localizedPath(link.href, locale)}>{t(link.label)}</a>)}
    </nav>}
    </section>)}
  </>;
}
