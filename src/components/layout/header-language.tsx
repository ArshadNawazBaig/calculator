"use client";
import dynamic from 'next/dynamic';
import {languages} from '@/lib/i18n/config';
import {useI18n} from '@/components/i18n/provider';
import {usePreferences} from '@/components/i18n/preferences-provider';
import {HeaderPopover} from "./header-popover";
import {ChevronDown,Languages} from "lucide-react";
import styles from "./header.module.css";

const RegionPreferences = dynamic(() => import('./region-preferences'));

export function HeaderLanguage(){
  const {locale,t}=useI18n();
  const {currency}=usePreferences();
  return <HeaderPopover label={t('Language: {name}',{name:languages[locale].name})} description={`${t('Currency')}: ${currency}`}
    triggerClassName={`${styles.utilityTrigger} ${styles.languageTrigger}`} dialogLabel={t('Website language')}
    dialogClassName={styles.languageDialog} popoverClassName={styles.languagePopover}
    trigger={<><Languages size={18} aria-hidden="true"/><span className={styles.languageCode}>{locale.toUpperCase()}</span><span className={styles.currencyCode}>{currency}</span><ChevronDown className={styles.languageChevron} size={12} aria-hidden="true"/></>}>
    <RegionPreferences/>
  </HeaderPopover>;
}
