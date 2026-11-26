import translatedPages from '@/data/locales/translated-pages.json';

export function isTranslatedLanding(path: string): boolean {
  return path === '/' || path === '/calculators' || path === '/calculators/students' || /^\/calculators\/(finance|health|math|everyday)(?:\/[^/?#]+)?$/.test(path);
}
const translatedPageSet = /*#__PURE__*/ new Set<string>(translatedPages);
export function isTranslatedPage(path: string): boolean {
  return isTranslatedLanding(path) || translatedPageSet.has(path);
}
