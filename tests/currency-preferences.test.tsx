import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {parsePreferences, resolvePreferences, currencyText, currencyLabel} from '@/lib/i18n/preferences';
import {calculatorCurrencyPolicy, resolveCalculatorCurrency} from '@/lib/calculators/currency-policy';
import {definitionMap} from '@/lib/calculators/registry';
import {formatMetric} from '@/lib/calculators/format-metric';
import {CalculatorResult} from '@/components/calculators/result';
import {CalculatorField} from '@/components/calculators/field';
import {LanguageProvider} from '@/components/i18n/provider';

const mode = (slug: string, algorithm?: string) => {
  const definition = definitionMap.get(slug)!;
  return algorithm ? definition.modes.find(mode => mode.algorithm === algorithm)! : definition.modes[0];
};

describe('country and currency preferences', () => {
  it('suggests language defaults and keeps explicit choices across languages', () => {
    expect(resolvePreferences('en', {})).toEqual({country: 'US', currency: 'USD'});
    expect(resolvePreferences('de', {})).toEqual({country: 'DE', currency: 'EUR'});
    expect(resolvePreferences('pt', {})).toEqual({country: 'BR', currency: 'BRL'});
    expect(resolvePreferences('ar', {})).toEqual({country: 'AE', currency: 'AED'});
    expect(resolvePreferences('fr', {country: 'CA'})).toEqual({country: 'CA', currency: 'CAD'});
    expect(resolvePreferences('ar', {country: 'CA', currency: 'EUR'})).toEqual({country: 'CA', currency: 'EUR'});
  });
  it('ignores invalid or tampered browser storage', () => {
    for (const raw of ['invalid', 'null', '[]', '{"country":"constructor","currency":"toString"}', '{"country":{},"currency":123}']) expect(parsePreferences(raw)).toEqual({});
    expect(parsePreferences('{"country":"GB","currency":"CHF","inputs":{"salary":1234}}')).toEqual({country:'GB',currency:'CHF'});
  });
  it('keeps all regional tools fixed regardless of preferred currency', () => {
    for (const [slug, currency] of [
      ['canadian-mortgage-calculator','CAD'], ['mortgage-calculator-uk','GBP'],
      ['tax-calculator','USD'], ['take-home-pay-calculator','USD'], ['401k-calculator','USD'],
      ['ira-calculator','USD'], ['roth-ira-calculator','USD'], ['fha-loan-calculator','USD'],
      ['va-mortgage-calculator','USD'], ['social-security-calculator','USD'], ['rmd-calculator','USD'],
    ]) for (const model of definitionMap.get(slug)!.modes) expect(resolveCalculatorCurrency(slug,model,'AED')).toBe(currency);
  });
  it('resolves the current mode instead of applying a currency to an entire mixed-purpose tool', () => {
    expect(resolveCalculatorCurrency('auto-loan-calculator',mode('auto-loan-calculator','auto-loan'),'EUR')).toBe('EUR');
    expect(resolveCalculatorCurrency('auto-loan-calculator',mode('auto-loan-calculator','vehicle-state-tax'),'EUR')).toBe('USD');
    expect(resolveCalculatorCurrency('inflation-calculator',mode('inflation-calculator','cpi-historical'),'EUR')).toBe('USD');
    expect(resolveCalculatorCurrency('inflation-calculator',mode('inflation-calculator','inflation'),'EUR')).toBe('EUR');
    for(const model of definitionMap.get('currency-calculator')!.modes) expect(calculatorCurrencyPolicy('currency-calculator',model).kind).toBe('independent');
    expect(calculatorCurrencyPolicy('fuel-cost-calculator',mode('fuel-cost-calculator','fuel-units')).kind).toBe('independent');
  });
  it('changes currency formatting, not numeric values or arbitrary text', () => {
    expect(formatMetric({label:'Total',value:1234.5,format:'money'},'EUR','de')).toBe('1.234,50 €');
    expect(formatMetric({label:'Total',value:1234.5,format:'money'},'JPY','en')).toBe('¥1,235');
    expect(formatMetric({label:'Total',value:12.345,format:'money'},'KWD','en')).toContain('12.345');
    expect(formatMetric({label:'Total',value:'USD $ user content'},'EUR','de')).toBe('USD $ user content');
    expect(currencyText('Price ($/kWh)','EUR')).toBe('Price (EUR/kWh)');
    expect(currencyLabel('Dollars','EUR',text=>text)).toBe('Fixed amount');
    const html=renderToStaticMarkup(<LanguageProvider locale="en" messages={{}}><CalculatorResult currency="EUR" result={{metrics:[{label:'Result',value:'USD $ user content'}],table:{headers:['Amount ($)'],rows:[['CAD $ user content']]}}}/></LanguageProvider>);
    expect(html).toContain('Amount (EUR)');
    expect(html).toContain('CAD $ user content');
    expect(html).toContain('USD $ user content');
    const matrix=renderToStaticMarkup(<CalculatorResult currency="EUR" currencyLabels={false} result={{metrics:[],table:{headers:['USD','GBP','CAD'],rows:[[1,2,3]]}}}/>);
    for(const code of ['USD','GBP','CAD'])expect(matrix).toContain(`>${code}</th>`);
  });
  it('updates input units without changing the stored input', () => {
    const field=mode('loan-calculator').fields.find(field=>field.key==='principal')!;
    const html=renderToStaticMarkup(<LanguageProvider locale="en" messages={{}}><CalculatorField currency="EUR" field={field} value="1234.5" prefix="test" onChange={()=>{}}/></LanguageProvider>);
    expect(html).toContain('<span>EUR</span>');
    expect(html).toContain('value="1234.5"');
    expect(field.unit).toBe('$');
  });
});
