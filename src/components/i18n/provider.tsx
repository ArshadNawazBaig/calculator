'use client';
import {createContext, useContext, useMemo, type ReactNode} from 'react';
import {I18nProvider} from 'react-aria-components';
import {languages, localizedPath, translator, type Dictionary, type Locale} from '@/lib/i18n/config';
const Context = createContext<{locale: Locale; messages: Dictionary}>({locale: 'en', messages: {}});
export function LanguageProvider({locale, messages, children}: {locale: Locale; messages: Dictionary; children: ReactNode}) {
  const value = useMemo(() => ({locale, messages}), [locale, messages]);
  return <Context.Provider value={value}><I18nProvider locale={`${languages[locale].tag}-u-ca-gregory`}>{children}</I18nProvider></Context.Provider>;
}
export function useI18n() {
  const {locale, messages} = useContext(Context);
  return useMemo(() => ({locale, messages, t: translator(messages), href: (path: string) => localizedPath(path, locale)}), [locale, messages]);
}
