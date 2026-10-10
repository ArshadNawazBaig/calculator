import {describe, expect, it, vi, afterEach} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {getContentDictionary, calculatorMessages} from '@/lib/i18n/content';
import {translator, locales, isTranslatedPage} from '@/lib/i18n/config';
import {CalculatorArticle} from '@/components/i18n/calculator-article';
import {definitionMap} from '@/lib/calculators/registry';
import {calculate} from '@/lib/calculators/engine';
import {defaults} from '@/lib/calculators/types';
import {site} from '@/lib/site';
import sitemap from '@/app/sitemap';
import {languageAlternates, pageMetadata} from '@/lib/metadata';
import translatedPages from '@/data/locales/translated-pages.json';
import vehiclePolicy from '@/data/vehicle-tax-2026.json';

// Restore the imported site's mutable test setting without re-importing the registry.
const originalIndexing = site.indexable;
afterEach(() => {site.indexable = originalIndexing; vi.restoreAllMocks();});

describe('complete localized content', () => {
  it('translates interpolated messages while retaining values and contact addresses', () => {
    const t = translator({
      '{value0} must be at least {value1}.': '{value0} debe ser al menos {value1}.',
      'Loan amount': 'Importe del préstamo',
      'Taxable income': 'Renta imponible',
      'Contact {contactEmail}.': 'Escribe a {contactEmail}.',
      '{value0} {value1}': 'Never match arbitrary text',
      'Source: ECB. {value0}Reference only.': 'Fuente: BCE. {value0}Solo como referencia.',
    });
    expect(t('Loan amount must be at least 1000.')).toBe('Importe del préstamo debe ser al menos 1000.');
    expect(t('loan amount must be at least 1000.')).toBe('Importe del préstamo debe ser al menos 1000.');
    expect(t('Taxable Income')).toBe('Renta imponible');
    expect(t('Contact support@example.org.')).toBe('Escribe a support@example.org.');
    expect(t('Unrecognized text')).toBe('Unrecognized text');
    expect(t('Source: ECB. Reference only.')).toBe('Fuente: BCE. Solo como referencia.');
  });

  it('ships the relevant calculator labels and engine messages to each form', async () => {
    for (const locale of locales.filter(locale => locale !== 'en')) {
      const messages = await getContentDictionary(locale);
      const mortgage = calculatorMessages(messages, 'mortgage-calculator', 'finance');
      const t = translator(mortgage);
      const definition = definitionMap.get('mortgage-calculator')!;
      for (const mode of definition.modes) for (const field of mode.fields) {
        expect(mortgage[field.label], `${locale}: ${field.label}`).toBeTruthy();
      }
      expect(t('Loan amount must be at least 1000.')).not.toBe('Loan amount must be at least 1000.');
      expect(mortgage[vehiclePolicy.states[0].notes[0]]).toBeTruthy();
      const files = translator(calculatorMessages(messages, 'base64-encode-decode', 'everyday'));
      expect(files('The input file must contain ASCII Base64 text.')).not.toBe('The input file must contain ASCII Base64 text.');
      expect(Object.keys(mortgage).length).toBeLessThan(Object.keys(messages).length / 2);
    }
  });

  it('renders translated explanations and FAQ content in server HTML', async () => {
    const definition = definitionMap.get('percent-calculator')!;
    const initial = await calculate('math', definition.modes[0], defaults(definition.modes[0]));
    const messages = await getContentDictionary('es');
    const html = renderToStaticMarkup(<CalculatorArticle definition={definition} initial={initial} currency="USD" locale="es" messages={messages}/>);
    expect(html).not.toContain('English reference content');
    expect(html).not.toContain('How to use this calculator');
    expect(html).not.toContain('Reference example currency');
    expect(html).not.toContain(definition.modes[0].explanation);
  });

  it('publishes all language variants with reciprocal alternates and excludes system pages', () => {
    site.indexable = true;
    const entries = sitemap();
    expect(translatedPages).toHaveLength(243);
    expect(entries).toHaveLength(translatedPages.length * locales.length);
    expect(new Set(entries.map(entry => entry.url)).size).toBe(entries.length);
    for (const path of ['/mortgage-calculator', '/mileage-calculator', '/guides/compound-interest-and-contributions', '/privacy']) {
      expect(translatedPages).toContain(path);
      const variants = languageAlternates(path)!;
      for (const locale of locales) expect(variants[locale]).toBeTruthy();
      expect(variants['x-default']).toBe(site.url + path);
    }
    for (const entry of entries) expect(Object.keys(entry.alternates!.languages!)).toHaveLength(locales.length + 1);
    for (const path of ['/search', '/offline', '/maintenance', '/network-error', '/weight-watchers-points-calculator']) {
      expect(isTranslatedPage(path)).toBe(false);
      expect(entries.some(entry => entry.url === site.url + path)).toBe(false);
    }
    expect(pageMetadata('Hipoteca', 'Descripción', '/mortgage-calculator', true, 'es').robots).toEqual({index: true, follow: true});
    site.indexable = false;
    expect(sitemap()).toEqual([]);
    expect(pageMetadata('Hipoteca', 'Descripción', '/mortgage-calculator', true, 'es').robots).toEqual({index: false, follow: true});
  });
});
