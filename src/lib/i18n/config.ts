export const locales = ['en', 'es', 'fr', 'de', 'pt', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const languages: Record<Locale, {name: string; tag: string; direction: 'ltr' | 'rtl'}> = {
  en: {name: 'English', tag: 'en-US', direction: 'ltr'},
  es: {name: 'Español', tag: 'es', direction: 'ltr'},
  fr: {name: 'Français', tag: 'fr', direction: 'ltr'},
  de: {name: 'Deutsch', tag: 'de', direction: 'ltr'},
  pt: {name: 'Português', tag: 'pt', direction: 'ltr'},
  ar: {name: 'العربية', tag: 'ar', direction: 'rtl'},
};
export function isLocale(value: string): value is Locale {
  return locales.some(locale => locale === value);
}
export function splitLocale(path: string): {locale: Locale; path: string} {
  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex < 0 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex < 0 ? '' : path.slice(suffixIndex);
  const segment = pathname.split('/')[1];
  return isLocale(segment)
    ? {locale: segment, path: (pathname.slice(segment.length + 1) || '/') + suffix}
    : {locale: 'en', path};
}
export function localizedPath(path: string, locale: Locale): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const clean = splitLocale(path).path;
  if (/^\/(?:api|_next)(?:\/|$)/.test(clean) || /\.[a-z0-9]+(?:[?#]|$)/i.test(clean)) return clean;
  return locale === 'en' ? clean : `/${locale}${clean === '/' ? '' : clean}`;
}
export type Dictionary = Record<string, string>;
export function translator(messages: Dictionary) {
  return (key: string, values?: Record<string, string | number>) => {
    const text = Object.hasOwn(messages, key) ? messages[key] : key;
    return values ? text.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match)) : text;
  };
}
// Only complete translated landing pages are submitted to search engines.
// Technical articles and policy text retain an explicitly labelled English source.
export function isTranslatedLanding(path: string): boolean {
  return path === '/' || path === '/calculators' || /^\/calculators\/(finance|health|math|everyday)(?:\/[^/?#]+)?$/.test(path);
}
