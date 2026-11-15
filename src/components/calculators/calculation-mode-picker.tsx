'use client';

import {useEffect, useRef} from 'react';
import {Check} from 'lucide-react';
import {useI18n} from '@/components/i18n/provider';
import type {Mode} from '@/lib/calculators/types';
import type {CategoryId} from '@/lib/site';
import {CalculationModeIcon} from './calculation-mode-icon';
import styles from './calculation-mode-picker.module.css';

export function CalculationModePicker({slug, modes, selected, disabled, onChange, category}: {
  slug: string; modes: Mode[]; selected: string; disabled: boolean;
  onChange: (id: string) => void; category: CategoryId;
}) {
  const {t} = useI18n();
  const choices = useRef<HTMLDivElement>(null);
  const dense = modes.length > 8;

  // Reveal a restored or deep-linked choice inside a long list without moving the page.
  useEffect(() => {
    if (!dense) return;
    const list = choices.current;
    const active = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!list || !active) return;
    const top = active.offsetTop, bottom = top + active.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [dense, selected]);

  return <fieldset id="calculation-mode" className={`${styles.picker} no-print`} disabled={disabled} data-calculation-mode-picker>
    <legend className={styles.legend}>
      <span>{t('What would you like to calculate?')}</span>
      {dense && <a href="#calculator-inputs">{t('Your inputs')} <span aria-hidden="true">↓</span></a>}
    </legend>
    <div ref={choices} className={styles.choices} data-dense={dense || undefined} data-pair={modes.length === 2 || undefined}>
      {modes.map(mode => <button key={mode.id} type="button" data-mode-choice={mode.id}
        aria-pressed={mode.id === selected} aria-controls="calculator-inputs"
        onClick={() => {if (mode.id !== selected) onChange(mode.id);}}>
        <span className={styles.icon}><CalculationModeIcon slug={slug} mode={mode} category={category}/></span>
        <span className={styles.title}>{t(mode.title)}</span>
        <Check className={styles.check} size={14} aria-hidden="true"/>
      </button>)}
    </div>
  </fieldset>;
}
