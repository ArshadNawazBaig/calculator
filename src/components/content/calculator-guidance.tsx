import content from '@/data/calculator-content.json';
import {translator, type Dictionary} from '@/lib/i18n/config';
import styles from './explanation.module.css';

type GuidanceSection = {
  title: string;
  paragraphs: string[];
  table?: {caption: string; headers: string[]; rows: string[][]};
  links?: {label: string; href: string}[];
};

/** Server-rendered topic guidance, shared by English and translated articles. */
export function CalculatorGuidance({slug, messages = {}}: {slug: string; messages?: Dictionary}) {
  const t = translator(messages);
  const entry = (content as Record<string, {sections: GuidanceSection[]}>)[slug];
  return entry?.sections.map((section, index) => <section key={section.title} id={`understanding-${index + 1}`}>
    <h2>{t(section.title)}</h2>
    {section.paragraphs.map(paragraph => <p key={paragraph}>{t(paragraph)}</p>)}
    {section.table && <div className={styles.scroll} role="region" aria-label={t(section.table.caption)} tabIndex={0}>
      <table className={styles.table}>
        <caption>{t(section.table.caption)}</caption>
        <thead><tr>{section.table.headers.map(header => <th key={header} scope="col">{t(header)}</th>)}</tr></thead>
        <tbody>{section.table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, columnIndex) => columnIndex === 0
          ? <th key={columnIndex} scope="row">{t(cell)}</th>
          : <td key={columnIndex}>{t(cell)}</td>)}</tr>)}</tbody>
      </table>
    </div>}
    {!!section.links?.length && <nav className={styles.methodLinks} aria-label={t(section.title)}>
      {section.links.map(link => <a key={link.href} href={link.href}>{t(link.label)}</a>)}
    </nav>}
  </section>);
}
