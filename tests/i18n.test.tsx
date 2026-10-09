import {describe, expect, it} from 'vitest';
import {locales, localizedPath, splitLocale, translator} from '@/lib/i18n/config';
import {getDictionary} from '@/lib/i18n/dictionaries';
import {searchCalculators} from '@/lib/calculator-search';
import {money, number} from '@/lib/format';
import catalog from '@/data/catalog.json';
import {languageAlternates, pageMetadata} from '@/lib/metadata';
import {renderToStaticMarkup} from 'react-dom/server';
import {LanguageProvider} from '@/components/i18n/provider';
import {CalculatorResult} from '@/components/calculators/result';

describe('multilingual navigation and content', () => {
  it('preserves the tool, query and fragment without duplicate language prefixes', () => {
    expect(localizedPath('/es/search?q=pr%C3%A9stamo#results', 'fr')).toBe('/fr/search?q=pr%C3%A9stamo#results');
    expect(localizedPath('/ar/mortgage-calculator', 'en')).toBe('/mortgage-calculator');
    expect(localizedPath('/', 'ar')).toBe('/ar');
    expect(splitLocale('/fr')).toEqual({locale:'fr', path:'/'});
    expect(localizedPath('/api/health', 'de')).toBe('/api/health');
    expect(localizedPath('/og.png', 'pt')).toBe('/og.png');
    expect(localizedPath('https://example.com/', 'fr')).toBe('https://example.com/');
    expect(localizedPath('//example.com/', 'ar')).toBe('//example.com/');
  });
  it('has matching dictionaries and a translated name for every catalog entry', async () => {
    const dictionaries = await Promise.all(locales.filter(locale=>locale!=='en').map(getDictionary));
    for (const dictionary of dictionaries) {
      expect(Object.keys(dictionary).sort()).toEqual(Object.keys(dictionaries[0]).sort());
      for (const tool of catalog) expect(dictionary[`tool.${tool.slug}`]?.trim()).toBeTruthy();
      for (const key of Object.keys(dictionary)) {
        expect(dictionary[key]).not.toMatch(/\bundefined\b/);
        expect(dictionary[key].match(/\{\w+\}/g)?.sort()||[]).toEqual(key.match(/\{\w+\}/g)?.sort()||[]);
      }
    }
  });
  it('finds native-language names, ignores accents and retains English aliases', async () => {
    const es = await getDictionary('es'), ar = await getDictionary('ar');
    expect(searchCalculators('interes compuesto','finance',es)[0].slug).toBe('compound-interest-calculator');
    expect(searchCalculators('hipoteca','health',es)).toHaveLength(0);
    expect(searchCalculators('mortgage',undefined,es).some(tool=>tool.slug==='mortgage-calculator')).toBe(true);
    expect(searchCalculators('الفائدة المركبة',undefined,ar)[0].slug).toBe('compound-interest-calculator');
  });
  it('formats numbers for the language while keeping the calculator currency', () => {
    expect(number(1234.5,2,'de')).toBe('1.234,5');
    expect(money(100,'USD',2,'fr')).toMatch(/100,00/);
    expect(money(100,'USD',2,'fr')).toMatch(/\$US/);
  });
  it('translates result labels while preserving user text and string table cells', async () => {
    const messages=await getDictionary('es');
    const html=renderToStaticMarkup(<LanguageProvider locale="es" messages={messages}><CalculatorResult result={{metrics:[{label:'Result',value:'Calculate'}],table:{headers:['Value'],rows:[['Reset']]}}}/></LanguageProvider>);
    expect(html).toContain('<dt>Resultado</dt><dd>Calculate</dd>');
    expect(html).toContain('<td>Reset</td>');
    expect(translator({})('constructor')).toBe('constructor');
    expect(translator({})('toString')).toBe('toString');
  });
  it('only advertises complete translations to search engines', () => {
    expect(languageAlternates('/calculators/finance')?.ar).toBe('https://finflo.org/ar/calculators/finance');
    expect(languageAlternates('/calculators/finance')?.['x-default']).toBe('https://finflo.org/calculators/finance');
    expect(languageAlternates('/mortgage-calculator')).toBeUndefined();
    const meta = pageMetadata('Hypothek','Beschreibung','/mortgage-calculator',false,'de');
    expect(meta.alternates?.canonical).toBe('/de/mortgage-calculator');
    expect(meta.robots).toEqual({index:false,follow:true});
    expect(translator({})('Interest')).toBe('Interest');
  });
});
