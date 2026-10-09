'use client';
import {ArrowLeftRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
export function CurrencySwap({onSwap, disabled}: {onSwap: () => void; disabled: boolean}) {
  return <Button type="button" variant="ghost" disabled={disabled} onClick={onSwap}><ArrowLeftRight size={16} aria-hidden="true"/>Swap currencies</Button>;
}
