'use client';
import {ArrowLeftRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useI18n} from '@/components/i18n/provider';
export function CurrencySwap({onSwap, disabled}: {onSwap: () => void; disabled: boolean}) {
  const {t} = useI18n();
  return <Button type="button" variant="ghost" disabled={disabled} onClick={onSwap}><ArrowLeftRight size={16} aria-hidden="true"/>{t('Swap currencies')}</Button>;
}
