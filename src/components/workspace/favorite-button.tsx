'use client';

import {useState} from 'react';
import {Star} from 'lucide-react';
import {useI18n} from '@/components/i18n/provider';
import {useHydrated} from '@/lib/use-hydrated';
import {toggleFavorite, useWorkspace} from '@/lib/workspace/store';
import styles from './workspace.module.css';

export function FavoriteButton({slug, title, compact = false}: {slug: string; title: string; compact?: boolean}) {
  const {t} = useI18n(), hydrated = useHydrated();
  const {data} = useWorkspace(), selected = data.favorites.includes(slug);
  const [failed, setFailed] = useState(false);
  return <span className={compact ? styles.favoriteCompact : styles.favoriteWrap}>
    <button type="button" className={styles.favorite} disabled={!hydrated} aria-pressed={selected}
      aria-label={t(selected ? 'Remove {title} from favorites' : 'Add {title} to favorites', {title})}
      onClick={() => setFailed(!toggleFavorite(slug).ok)}>
      <Star size={17} fill={selected ? 'currentColor' : 'none'} aria-hidden="true"/>
      {!compact && t(selected ? 'Favorited' : 'Favorite')}
    </button>
    {failed && <span role="alert" className={styles.error}>{t('Unable to save. Check browser storage or open My workspace.')}</span>}
  </span>;
}
