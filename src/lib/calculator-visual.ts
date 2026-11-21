import manifest from '@/data/calculator-visuals.json';
import themes from '@/data/calculator-visual-themes.json';
import symbols from '@/data/locales/calculator-symbols.json';
import type {Locale} from '@/lib/i18n/config';

type Entry = {theme: string; symbol: string; repeatedSymbol: boolean};
type Theme = {motif: Record<Locale, string>};

/** Describe the actual pictograms, using the same copy in the page and share card. */
export function calculatorVisual(slug: string, locale: Locale, title: string) {
  const entry = (manifest as Record<string, Entry>)[slug];
  if (!entry) return undefined;
  const theme = (themes.themes as Record<string, Theme>)[entry.theme];
  const symbol = locale === 'en' ? entry.symbol : (symbols as Record<string, Partial<Record<Locale, string>>>)[entry.symbol]?.[locale];
  if (!theme || !symbol) return undefined;
  const template = entry.repeatedSymbol ? themes.repeatedTemplates[locale] : themes.templates[locale];
  const alt = template.replace('{tool}', () => title).replace('{symbol}', () => symbol).replace('{motif}', () => theme.motif[locale]);
  return {
    src: `/illustrations/calculators/${slug}.webp`,
    socialSrc: `/illustrations/calculators/${slug}-social.jpg`,
    width: 1200,
    height: 630,
    alt,
  };
}
