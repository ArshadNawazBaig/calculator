import type {Dictionary, Locale} from './config';
const dictionaries = {
  en: async (): Promise<Dictionary> => ({}),
  es: () => import('@/data/locales/es.json').then(m => m.default),
  fr: () => import('@/data/locales/fr.json').then(m => m.default),
  de: () => import('@/data/locales/de.json').then(m => m.default),
  pt: () => import('@/data/locales/pt.json').then(m => m.default),
  ar: () => import('@/data/locales/ar.json').then(m => m.default),
  hi: () => import('@/data/locales/hi.json').then(m => m.default),
  tl: () => import('@/data/locales/tl.json').then(m => m.default),
};
export async function getDictionary(locale: Locale): Promise<Dictionary> { return dictionaries[locale](); }

/** Navigation and live search need names, but not every calculator description. */
export function sharedMessages(messages: Dictionary): Dictionary {
  return Object.fromEntries(Object.entries(messages).filter(([key]) => !key.startsWith('description.')));
}

/** Send card descriptions only on pages that render those cards. */
export function cardMessages(messages: Dictionary, tools: ReadonlyArray<{slug: string}>): Dictionary {
  return Object.fromEntries(tools.flatMap(({slug}) => {
    const key = `description.${slug}`;
    return Object.hasOwn(messages, key) ? [[key, messages[key]]] : [];
  }));
}
