'use client';

import {useState} from 'react';
import {BookmarkPlus, FolderHeart} from 'lucide-react';
import Link from '@/components/i18n/link';
import {useI18n} from '@/components/i18n/provider';
import {Button} from '@/components/ui/button';
import type {SavedCalculation} from '@/lib/workspace/model';
import {saveCalculation} from '@/lib/workspace/store';
import {FavoriteButton} from './favorite-button';
import styles from './workspace.module.css';

export function CalculatorActions({slug, title, snapshot, disabled, privateInput}: {
  slug: string; title: string; snapshot: Omit<SavedCalculation, 'id' | 'name' | 'createdAt'> | null; disabled: boolean; privateInput: boolean;
}) {
  const {t} = useI18n();
  const [name, setName] = useState(''), [message, setMessage] = useState('');
  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!snapshot || disabled) return;
    const result = saveCalculation({...snapshot, id: crypto.randomUUID(), name: name.trim() || title, createdAt: new Date().toISOString()});
    setMessage(result.ok ? 'Calculation saved on this device.' : result.error === 'limit'
      ? 'This calculation or workspace is too large. Export a backup and remove old calculations.'
      : 'Unable to save. Check browser storage or open My workspace.');
  }
  return <div className={`${styles.calculatorActions} no-print`}>
    <div className={styles.actionHeading}>
      <FavoriteButton slug={slug} title={title}/>
      <Link href="/workspace" className={styles.workspaceLink}><FolderHeart size={17} aria-hidden="true"/>{t('My workspace')}</Link>
    </div>
    {!privateInput && <form onSubmit={save} className={styles.saveForm}>
      <div><label htmlFor="saved-calculation-name">{t('Calculation name')}</label>
        <input id="saved-calculation-name" maxLength={80} value={name} placeholder={title} disabled={disabled} onChange={event => {setName(event.target.value);setMessage('');}}/>
      </div>
      <Button type="submit" variant="secondary" disabled={disabled || !snapshot}><BookmarkPlus size={16} aria-hidden="true"/>{t('Save calculation')}</Button>
      <p className={styles.hint}>{t(snapshot ? 'Saved only in this browser. Clear site data and your saved items will be removed.' : 'Calculate with your inputs to save a result or compare scenarios.')}</p>
      {message && <p role="status" className={styles.hint}>{t(message)}</p>}
    </form>}
  </div>;
}
