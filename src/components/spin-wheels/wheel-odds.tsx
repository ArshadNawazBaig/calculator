import {type Locale, languages} from '@/lib/i18n/config';
import copy from '@/data/locales/explanations.json';
import styles from '@/components/content/explanation.module.css';

/** Describe the published starting list, never pretend to track the user's edited wheel. */
export function WheelOdds({entries, locale = 'en', example = false}: {entries: string[]; locale?: Locale; example?: boolean}) {
  const text = copy[locale], nonempty = entries.filter(entry => entry.trim());
  const counts = new Map<string,number>();
  for (const entry of nonempty) counts.set(entry, (counts.get(entry) || 0) + 1);
  if (!nonempty.length) return null;
  const number = new Intl.NumberFormat(languages[locale].tag);
  const percent = new Intl.NumberFormat(languages[locale].tag, {style:'percent',maximumFractionDigits:2});
  return <section id="starting-odds" className={styles.panel}>
    <h2>{example ? text.wheelExampleTitle : text.wheelTitle}</h2><p>{text.wheelIntro}</p>
    <div className={styles.scroll} role="region" aria-label={text.wheelTitle} tabIndex={0}><table className={styles.table}>
      <caption>{example ? text.wheelExampleCaption : text.wheelCaption}</caption><thead><tr><th scope="col">{text.entry}</th><th scope="col">{text.tickets}</th><th scope="col">{text.probability}</th></tr></thead>
      <tbody>{[...counts].map(([entry,count]) => <tr key={entry}><th scope="row">{entry}</th><td>{number.format(count)} / {number.format(nonempty.length)}</td><td>{percent.format(count / nonempty.length)}<span className={styles.track} aria-hidden="true"><span className={styles.fill} style={{width:`${count / nonempty.length * 100}%`}}/></span></td></tr>)}</tbody>
    </table></div>
  </section>;
}
