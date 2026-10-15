'use client';

import {useEffect} from 'react';
import {parseWorkspace, workspaceKey, type SavedCalculation} from '@/lib/workspace/model';
import {movedStudentMode} from '@/lib/student-tools';
import {useI18n} from '@/components/i18n/provider';

/** A fragment identifies a local record; inputs never enter a request URL. */
export function RestoreCalculation({slug, onRestore, onMissing}: {slug: string; onRestore: (saved: SavedCalculation) => void; onMissing: () => void}) {
  const {href} = useI18n();
  useEffect(() => {
    let restored = '';
    function restore() {
      const id = new URLSearchParams(window.location.hash.slice(1)).get('saved');
      if (!id || id === restored) return;
      restored = id;
      try {
        const saved = parseWorkspace(window.localStorage.getItem(workspaceKey))?.calculations.find(item => item.id === id);
        if (saved?.slug === slug) onRestore(saved);
        else if (saved && movedStudentMode(slug, saved.modeId) === saved.slug) window.location.replace(href(`/${saved.slug}`) + window.location.hash);
        else onMissing();
      } catch {onMissing();}
    }
    restore();
    window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
  }, [slug, onRestore, onMissing, href]);
  return null;
}
