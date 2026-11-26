'use client';
import {useId, useSyncExternalStore} from 'react';
import {Check, Monitor, Moon, Sun} from 'lucide-react';
import {HeaderPopover} from './header-popover';
import {useI18n} from '@/components/i18n/provider';
import {applyTheme, parseTheme, themeChangeEvent, themeStorageKey, type ThemePreference} from '@/lib/theme';
import styles from './theme-selector.module.css';
import header from './header.module.css';

const getSnapshot = () => parseTheme(document.documentElement.dataset.theme);
const getServerSnapshot = (): ThemePreference => 'system';
function subscribe(listener: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const syncSystem = () => applyTheme(getSnapshot());
  const syncStorage = (event: StorageEvent) => {
    if (event.key !== themeStorageKey && event.key !== null) return;
    applyTheme(parseTheme(event.newValue));
    listener();
  };
  // Another tab may change storage between the bootstrap and hydration.
  let initial = getSnapshot();
  try { initial = parseTheme(window.localStorage.getItem(themeStorageKey)); } catch {}
  applyTheme(initial);
  window.addEventListener(themeChangeEvent, listener);
  window.addEventListener('storage', syncStorage);
  media.addEventListener('change', syncSystem);
  return () => {
    window.removeEventListener(themeChangeEvent, listener);
    window.removeEventListener('storage', syncStorage);
    media.removeEventListener('change', syncSystem);
  };
}
function selectTheme(theme: ThemePreference) {
  applyTheme(theme);
  try {
    if (theme === 'system') window.localStorage.removeItem(themeStorageKey);
    else window.localStorage.setItem(themeStorageKey, theme);
  } catch { /* Keep the current page usable when browser storage is unavailable. */ }
  window.dispatchEvent(new Event(themeChangeEvent));
}

export function ThemeSelector() {
  const {t} = useI18n();
  const groupId = useId();
  const preference = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ActiveIcon = preference === 'system' ? Monitor : preference === 'light' ? Sun : Moon;
  const themeLabel = t(preference === 'system' ? 'System' : preference === 'light' ? 'Light' : 'Dark');
  return <HeaderPopover label={t('Appearance')} description={themeLabel} trigger={<ActiveIcon size={18} aria-hidden="true"/>}
    triggerClassName={`${header.utilityTrigger} ${header.iconTrigger}`} dialogLabel={t('Appearance')} dialogClassName={styles.dialog} popoverClassName={styles.popover}>
        <h2>{t('Appearance')}</h2>
        <div role="radiogroup" aria-label={t('Color theme')} className={styles.options}>
          {([
            {value: 'system', label: t('System'), Icon: Monitor},
            {value: 'light', label: t('Light'), Icon: Sun},
            {value: 'dark', label: t('Dark'), Icon: Moon},
          ] as const).map(({value, label, Icon}) => <label key={value} className={styles.option}>
            <input type="radio" name={groupId} value={value} checked={preference === value} onChange={() => selectTheme(value)}/>
            <Icon size={18} aria-hidden="true"/>
            <span>{label}</span>
            {preference === value && <Check size={17} aria-hidden="true"/>}
          </label>)}
        </div>
        <p>{t('System follows your device settings.')}</p>
  </HeaderPopover>;
}
