import type {Mode} from '@/lib/calculators/types';
import {translator, type Dictionary, type Locale} from '@/lib/i18n/config';
import copy from '@/data/locales/explanations.json';
import styles from './explanation.module.css';

export function MethodNavigation({modes, messages = {}, locale = 'en'}: {modes: Mode[]; messages?: Dictionary; locale?: Locale}) {
  const t = translator(messages);
  return <nav className={styles.methodLinks} aria-label={copy[locale].choose}>{modes.map(mode => <a key={mode.id} href={`#method-${mode.id}`}>{t(mode.title)}</a>)}</nav>;
}
