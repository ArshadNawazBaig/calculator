"use client";
import dynamic from 'next/dynamic';
import {useCallback, useEffect, useId, useRef, useState} from 'react';
import {Search as SearchIcon} from 'lucide-react';
import {useI18n} from '@/components/i18n/provider';
import styles from './header.module.css';

const HeaderSearchDialog = dynamic(() => import('./header-search-dialog'));

export function HeaderSearch() {
  const {t} = useI18n();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  const close = useCallback(() => {
    setOpen(false);
    trigger.current?.focus({preventScroll: true});
  }, []);
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (event.isComposing) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (open) close(); else setOpen(true);
      } else if (open && event.key === 'Escape' && !document.getElementById(dialogId)) {
        close();
      }
    }
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, [open, close, dialogId]);
  return <>
    <button type="button" ref={trigger} className={`${styles.utilityTrigger} ${styles.searchTrigger}`} aria-label={t('Search calculators')}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? dialogId : undefined} aria-keyshortcuts="Control+k Meta+k" onClick={() => setOpen(true)}>
      <SearchIcon size={18} aria-hidden="true"/><span className={styles.searchTriggerLabel}>{t('Search')}</span>
    </button>
    {open && <HeaderSearchDialog id={dialogId} onClose={close}/>}
  </>;
}
