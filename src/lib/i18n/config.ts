import translatedPages from '@/data/locales/translated-pages.json';
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
type MessageTemplate = {pattern: RegExp; names: string[]; translation: string};
const templateCache = new WeakMap<Dictionary, MessageTemplate[]>();
const labelCache = new WeakMap<Dictionary, Map<string, string>>();
const labelKey = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2').trim().toLowerCase();
export function translator(messages: Dictionary) {
  let templates = templateCache.get(messages);
  let labels = labelCache.get(messages);
  const label = (key: string) => {
    if (!/^[A-Za-z][A-Za-z\s-]{2,}$/.test(key)) return undefined;
    if (!labels) {
      labels = new Map(Object.entries(messages).filter(([key]) => /^[A-Za-z][A-Za-z\s-]{2,}$/.test(key)).map(([key,value]) => [labelKey(key),value]));
      labelCache.set(messages, labels);
    }
    return labels.get(labelKey(key));
  };
  return (key: string, values?: Record<string, string | number>) => {
    let text = Object.hasOwn(messages, key) ? messages[key] : label(key) ?? key;
    // Translate interpolated engine messages without modifying calculation IDs
    // or user-entered result values.
    if (text === key && !Object.hasOwn(messages, key)) {
      templates ??= Object.entries(messages).filter(([source]) => /\{(?:value\d+|contactEmail)\}/.test(source) && (source.replace(/\{\w+\}/g,'').match(/[a-zA-Z]/g)?.length||0)>=4).sort(([a],[b])=>b.length-a.length).map(([source, translation]) => {
        const names: string[] = [];
        const pattern = source.split(/(\{(?:value\d+|contactEmail)\})/).map(part => {
          if (/^\{(?:value\d+|contactEmail)\}$/.test(part)) {names.push(part.slice(1,-1)); return '(.*?)';}
          return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }).join('');
        return {pattern:new RegExp(`^${pattern}$`, 's'), names, translation};
      });
      templateCache.set(messages, templates);
      for (const template of templates) {
        const match = key.match(template.pattern);
        if (!match) continue;
        const captured = Object.fromEntries(template.names.map((name, index) => [name, Object.hasOwn(messages,match[index+1]) ? messages[match[index+1]] : label(match[index+1]) ?? match[index+1]]));
        text = template.translation.replace(/\{(\w+)\}/g, (token, name: string) => captured[name] ?? token);
        break;
      }
    }
    return values ? text.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match)) : text;
  };
}
export function isTranslatedLanding(path: string): boolean {
  return path === '/' || path === '/calculators' || /^\/calculators\/(finance|health|math|everyday)(?:\/[^/?#]+)?$/.test(path);
}
const translatedPageSet = new Set<string>(translatedPages);
export function isTranslatedPage(path: string): boolean {
  return isTranslatedLanding(path) || translatedPageSet.has(path);
}
