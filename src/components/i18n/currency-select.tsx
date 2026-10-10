'use client';
import {useMemo} from 'react';
import {Dropdown} from '@/components/ui/dropdown';
import {useI18n} from './provider';
import {currencies, isCurrency, type Currency} from '@/lib/i18n/preferences';

export function CurrencySelect({value, onChange, id, disabled = false}: {value: Currency; onChange: (currency: Currency) => void; id: string; disabled?: boolean}) {
  const {locale, t} = useI18n();
  const options = useMemo(() => {
    const names = new Intl.DisplayNames([locale], {type: 'currency'});
    return currencies.map(code => ({value: code, label: `${code} · ${names.of(code) || code}`}));
  }, [locale]);
  return <Dropdown id={id} aria-label={t('Currency')} value={value} onValueChange={next => {if (isCurrency(next)) onChange(next);}} options={options} searchable disabled={disabled}/>;
}
