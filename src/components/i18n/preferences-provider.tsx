'use client';
import {createContext, useContext, useMemo, useSyncExternalStore, type ReactNode} from 'react';
import type {Locale} from '@/lib/i18n/config';
import {countryCurrencies, parsePreferences, preferenceKey, resolvePreferences, type Country, type Currency, type Preferences} from '@/lib/i18n/preferences';

const changeEvent = 'finflo-preferences-change';
let memory: string | null = null;
let storageFailed = false;
function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {if (event.key === preferenceKey || event.key === null) listener();};
  window.addEventListener('storage', onStorage);
  window.addEventListener(changeEvent, listener);
  return () => {window.removeEventListener('storage', onStorage); window.removeEventListener(changeEvent, listener);};
}
function getSnapshot() {
  if (!storageFailed) {
    try {return window.localStorage.getItem(preferenceKey);} catch {storageFailed = true;}
  }
  return memory;
}
const getServerSnapshot = () => null;
function save(preferences: Preferences | null) {
  memory = preferences ? JSON.stringify(preferences) : null;
  try {
    if (memory) window.localStorage.setItem(preferenceKey, memory);
    else window.localStorage.removeItem(preferenceKey);
  } catch {storageFailed = true;}
  window.dispatchEvent(new Event(changeEvent));
}
type PreferenceContext = {
  country: Country; currency: Currency; custom: boolean;
  setCountry: (country: Country) => void; setCurrency: (currency: Currency) => void; reset: () => void;
};
const Context = createContext<PreferenceContext>({country: 'US', currency: 'USD', custom: false, setCountry: () => {}, setCurrency: () => {}, reset: () => {}});

export function PreferencesProvider({locale, children}: {locale: Locale; children: ReactNode}) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const value = useMemo(() => {
    const saved = parsePreferences(raw);
    const selected = resolvePreferences(locale, saved);
    return {...selected, custom: Boolean(saved.country || saved.currency),
      setCountry: (country: Country) => save({country, currency: countryCurrencies[country]}),
      setCurrency: (currency: Currency) => save({country: selected.country, currency}),
      reset: () => save(null),
    };
  }, [raw, locale]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const usePreferences = () => useContext(Context);
