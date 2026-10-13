'use client';

import {useEffect} from 'react';
import {parseWorkspace, workspaceKey, type SavedCalculation} from '@/lib/workspace/model';

/** A fragment identifies a local record; inputs never enter a request URL. */
export function RestoreCalculation({slug, onRestore, onMissing}: {slug: string; onRestore: (saved: SavedCalculation) => void; onMissing: () => void}) {
  useEffect(() => {
    let restored = '';
    function restore() {
      const id = new URLSearchParams(window.location.hash.slice(1)).get('saved');
      if (!id || id === restored) return;
      restored = id;
      try {
        const saved = parseWorkspace(window.localStorage.getItem(workspaceKey))?.calculations.find(item => item.id === id && item.slug === slug);
        if (saved) onRestore(saved); else onMissing();
      } catch {onMissing();}
    }
    restore();
    window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
  }, [slug, onRestore, onMissing]);
  return null;
}
