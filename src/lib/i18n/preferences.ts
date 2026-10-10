import type {Locale} from './config';

export const countryCurrencies = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD', IE: 'EUR',
  ES: 'EUR', MX: 'MXN', AR: 'ARS', FR: 'EUR', BE: 'EUR', CH: 'CHF',
  DE: 'EUR', AT: 'EUR', PT: 'EUR', BR: 'BRL', AE: 'AED', SA: 'SAR',
  QA: 'QAR', KW: 'KWD', EG: 'EGP', MA: 'MAD', IN: 'INR', PK: 'PKR',
  SG: 'SGD', JP: 'JPY',
} as const;
export type Country = keyof typeof countryCurrencies;
export const currencies = [...new Set(Object.values(countryCurrencies))].sort();
export type Currency = (typeof currencies)[number];
export type Preferences = {country?: Country; currency?: Currency};
export const preferenceKey = 'finflo.preferences.v1';
export const languageCountries: Record<Locale, Country> = {en: 'US', es: 'ES', fr: 'FR', de: 'DE', pt: 'BR', ar: 'AE'};
export const isCountry = (value: string): value is Country => Object.hasOwn(countryCurrencies, value);
export const isCurrency = (value: string): value is Currency => currencies.some(currency => currency === value);

export function parsePreferences(raw: string | null): Preferences {
  try {
    const value: unknown = JSON.parse(raw || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const {country, currency} = value as Record<string, unknown>;
    return {
      ...(typeof country === 'string' && isCountry(country) ? {country} : {}),
      ...(typeof currency === 'string' && isCurrency(currency) ? {currency} : {}),
    };
  } catch { return {}; }
}

export function resolvePreferences(locale: Locale, preferences: Preferences) {
  const country = preferences.country ?? languageCountries[locale];
  return {country, currency: preferences.currency ?? countryCurrencies[country]};
}

// Update only metadata supplied by the calculator, never user-entered strings.
export function currencyText(text: string, currency: string) {
  return text.replace(/\$|£|\b(?:USD|CAD|GBP)\b/g, currency);
}

export function currencyLabel(text: string, currency: string, t: (text: string) => string) {
  const neutral: Record<string, string> = {
    Dollars: 'Fixed amount', 'Fixed annual dollars': 'Fixed annual amount',
    'Dollars in today’s purchasing power': 'Amount in today’s purchasing power',
  };
  return currencyText(t(Object.hasOwn(neutral, text) ? neutral[text] : text), currency);
}
