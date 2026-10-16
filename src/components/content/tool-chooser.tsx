import Link from 'next/link';
import {definitionMap, toolMap} from '@/lib/calculators/registry';
import {isFieldActive} from '@/lib/calculators/field-visibility';
import {defaults} from '@/lib/calculators/types';
import {displayField} from '@/lib/calculators/input-display';
import {translator, localizedPath, type Dictionary, type Locale} from '@/lib/i18n/config';
import copy from '@/data/locales/explanations.json';
import styles from './explanation.module.css';

export function ToolChooser({slugs, messages = {}, locale = 'en'}: {slugs: string[]; messages?: Dictionary; locale?: Locale}) {
  const t = translator(messages), text = copy[locale];
  const tools = [...new Set(slugs)].flatMap(slug => {const definition = definitionMap.get(slug), tool = toolMap.get(slug); return definition && tool ? [{definition,tool}] : [];});
  if (!tools.length) return null;
  return <section className={styles.panel} data-tool-chooser>
    <h2>{text.comparison}</h2>
    <div className={styles.scroll} role="region" aria-label={text.comparison} tabIndex={0}><table className={styles.table}>
      <thead><tr><th scope="col">{text.choose}</th><th scope="col">{text.inputStep}</th><th scope="col">{text.methodStep}</th></tr></thead>
      <tbody>{tools.map(({definition,tool}) => {const mode = definition.modes[0], values = defaults(mode); return <tr key={tool.slug}>
        <th scope="row"><Link href={localizedPath(`/${tool.slug}#mode-${mode.id}`,locale)}>{t(`tool.${tool.slug}`) === `tool.${tool.slug}` ? tool.title : t(`tool.${tool.slug}`)}</Link><p>{t(mode.title)}</p></th>
        <td><ul>{mode.fields.filter(field => isFieldActive(mode,field,values)).map(field => {const shown = displayField(mode,field,values); return <li key={field.key}>{t(shown.label)}{shown.unit ? ` (${t(shown.unit)})` : ''}</li>;})}</ul></td>
        <td><p dir="auto">{t(mode.formula)}</p><Link className="text-link" href={localizedPath(`/${tool.slug}#method-${mode.id}`,locale)}>{t('How it works')}</Link></td>
      </tr>;})}</tbody>
    </table></div>
  </section>;
}
