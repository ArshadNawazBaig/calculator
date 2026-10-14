'use client';
import {ChevronDown, LockKeyhole} from 'lucide-react';
import {useI18n} from '@/components/i18n/provider';
import {usePreferences} from '@/components/i18n/preferences-provider';
import {CurrencySelect} from '@/components/i18n/currency-select';
import {calculatorCurrencyPolicy} from '@/lib/calculators/currency-policy';
import type {Mode} from '@/lib/calculators/types';
import styles from './currency-preference.module.css';

export function CalculatorCurrency({slug, mode, disabled}: {slug: string; mode: Mode; disabled: boolean}) {
  const {t} = useI18n();
  const {currency, setCurrency} = usePreferences();
  const policy = calculatorCurrencyPolicy(slug, mode);
  if (policy.kind === 'none' || policy.kind === 'independent') return null;
  if (policy.kind === 'selectable') return <details className={`${styles.panel} ${styles.disclosure}`} data-calculator-currency>
    <summary><span>{t('Currency')}: <strong>{currency}</strong></span><ChevronDown size={16} aria-hidden="true"/></summary>
    <div className={styles.controls}>
      <div className={styles.selection}><label htmlFor="calculator-currency">{t('Currency')}</label><CurrencySelect id="calculator-currency" value={currency} onChange={setCurrency} disabled={disabled}/></div>
      <p aria-live="polite">{t('Enter all amounts in {currency}. Changing currency keeps numbers unchanged; no exchange rate is applied.', {currency})}</p>
    </div>
  </details>;
  return <div className={styles.panel} data-calculator-currency>
      <strong><LockKeyhole size={16} aria-hidden="true"/>{t('Calculator currency: {currency}', {currency: policy.currency})}</strong>
      <p>{t('This model uses {currency}. Your language and currency preferences do not change its regional rules.', {currency: policy.currency})}</p>
  </div>;
}
