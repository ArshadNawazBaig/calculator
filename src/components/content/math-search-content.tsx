import Link from '@/components/document-link';
import {mathSearchContent} from '@/data/math-search-content';
import styles from './explanation.module.css';

/** Keep this component on the server so the direct answer is in the initial HTML. */
export function MathSearchAnswer({slug}: {slug: string}) {
  const content = mathSearchContent[slug];
  if (!content) return null;
  return <section className={`${styles.panel} ${styles.insight}`} data-math-search-answer aria-labelledby="math-answer-heading"><h2 id="math-answer-heading">{content.answerHeading}</h2><p>{content.answer}</p><nav className={styles.methodLinks} aria-label="Calculation reference"><a href="#calculator-inputs">Use the calculator</a><a href="#formula-reference">Formulas and examples</a></nav></section>;
}

/** Task-specific reference content for the existing English calculator pages. */
export function MathSearchContent({slug}: {slug: string}) {
  const content = mathSearchContent[slug];
  if (!content) return null;
  return <div data-math-search-content>
    <section id="formula-reference" className={styles.panel} aria-labelledby="formula-reference-heading">
      <h2 id="formula-reference-heading">{content.tableHeading}</h2>
      <p>{content.tableIntroduction}</p>
      <p id="formula-scroll-hint" className={styles.scrollHint}>Scroll sideways to see all columns.</p>
      <div className={styles.scroll} role="region" aria-labelledby="formula-reference-heading" aria-describedby="formula-scroll-hint" tabIndex={0}>
        <table className={styles.table}>
          <caption>{content.tableCaption}</caption>
          <thead><tr>
            <th scope="col">{content.firstColumn}</th>
            <th scope="col">Formula</th>
            <th scope="col">Example inputs</th>
            <th scope="col">Result</th>
          </tr></thead>
          <tbody>{content.rows.map(row => <tr key={row.id}>
            <th scope="row">{row.label}</th>
            <td>{row.formula}</td>
            <td>{row.example}</td>
            <td data-numeric>{row.result}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
    {content.sections.map(section => <section key={section.id} id={section.id} className={styles.panel} aria-labelledby={`${section.id}-heading`}>
      <h2 id={`${section.id}-heading`}>{section.heading}</h2>
      {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      {section.link && <p>{section.link.before}<Link href={section.link.href}>{section.link.label}</Link>{section.link.after}</p>}
    </section>)}
  </div>;
}
