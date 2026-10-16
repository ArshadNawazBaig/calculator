'use client';
import {useI18n} from '@/components/i18n/provider';
import copy from '@/data/locales/utility-guidance.json';
import styles from './explanation.module.css';

export function UtilityGuidance({page}: {page:'search'|'workspace'}) {
  const {locale}=useI18n(), note=copy[locale][page];
  return <section className={`${styles.panel} ${styles.insight}`}><h2>{note.heading}</h2><p>{note.body}</p></section>;
}
