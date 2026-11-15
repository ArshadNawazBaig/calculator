'use client';

import {Check} from 'lucide-react';
import {useI18n} from '@/components/i18n/provider';
import type {Mode, Result, Values} from '@/lib/calculators/types';
import {CalculatorField} from './field';
import cards from './calculation-mode-picker.module.css';
import styles from './dice-controls.module.css';

const counts = [1, 2, 3, 4, 5, 6];
const sidesPresets = [4, 6, 8, 10, 12, 20, 100];
const pips: Record<number, number[][]> = {
  1: [[32, 32]],
  2: [[19, 19], [45, 45]],
  3: [[19, 19], [32, 32], [45, 45]],
  4: [[19, 19], [45, 19], [19, 45], [45, 45]],
  5: [[19, 19], [45, 19], [32, 32], [19, 45], [45, 45]],
  6: [[19, 19], [45, 19], [19, 32], [45, 32], [19, 45], [45, 45]],
};
const outlines: Record<number, string> = {
  4: 'M32 5 60 57H4Z',
  8: 'M32 3 60 32 32 61 4 32Z',
  10: 'M32 3 58 25 50 52 32 61 14 52 6 25Z',
  12: 'M32 4 59 24 49 57H15L5 24Z',
  20: 'M18 5H46L60 32 46 59H18L4 32Z',
};

/** A face is decorative; its enclosing die supplies the accessible value. */
export function DiceFace({sides, value}: {sides: number; value?: number}) {
  const dots = sides === 6 && value !== undefined ? pips[value] : undefined;
  return <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
    {outlines[sides]
      ? <path d={outlines[sides]} stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
      : <rect x="6" y="6" width="52" height="52" rx="10" stroke="currentColor" strokeWidth="2.5"/>}
    {dots ? dots.map(([cx, cy], index) => <circle key={index} data-pip cx={cx} cy={cy} r="4.5" fill="currentColor"/>)
      : <text x="32" y={sides === 4 ? 43 : 39} textAnchor="middle" fill="currentColor" fontFamily="inherit" fontWeight="650" fontSize={String(value ?? '?').length > 2 ? 17 : 24}>{value ?? '?'}</text>}
  </svg>;
}

function DiceCountIcon({count}: {count: number}) {
  const columns = Math.min(count, 3), rows = Math.ceil(count / 3);
  return <svg viewBox="0 0 48 34" fill="none" aria-hidden="true" focusable="false">
    {Array.from({length: count}, (_, index) => {
      const x = (48 - columns * 14) / 2 + index % 3 * 14, y = (34 - rows * 14) / 2 + Math.floor(index / 3) * 14;
      return <g key={index}><rect x={x} y={y} width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx={x + 5.5} cy={y + 5.5} r="1.5" fill="currentColor"/></g>;
    })}
  </svg>;
}

export function DiceControls({mode, values, disabled, onChange}: {
  mode: Mode; values: Values; disabled: boolean; onChange: (key: string, value: string) => void;
}) {
  const {t} = useI18n();
  return <div className={styles.controls} data-dice-controls>
    <fieldset className={styles.picker} disabled={disabled}>
      <legend>{t('Number of dice')}</legend>
      <div className={`${cards.choices} ${styles.choices}`}>
        {counts.map(count => <button key={count} type="button" data-dice-count={count} aria-pressed={Number(values.count) === count} aria-controls="dice-count" onClick={() => {if (Number(values.count) !== count) onChange('count', String(count));}}>
          <span className={`${cards.icon} ${styles.countIcon}`}><DiceCountIcon count={count}/></span>
          <span className={cards.title}>{count} {t(count === 1 ? 'die' : 'dice')}</span>
          <Check className={cards.check} size={14} aria-hidden="true"/>
        </button>)}
      </div>
    </fieldset>
    <fieldset className={styles.picker} disabled={disabled}>
      <legend>{t('Sides per die')}</legend>
      <div className={`${cards.choices} ${styles.choices}`}>
        {sidesPresets.map(sides => <button key={sides} type="button" data-dice-sides={sides} aria-pressed={Number(values.sides) === sides} aria-controls="dice-sides" onClick={() => {if (Number(values.sides) !== sides) onChange('sides', String(sides));}}>
          <span className={cards.icon}><DiceFace sides={sides} value={sides}/></span>
          <span className={cards.title}>D{sides}</span>
          <Check className={cards.check} size={14} aria-hidden="true"/>
        </button>)}
      </div>
    </fieldset>
    <p className={styles.hint}>{t('Choose a card or enter your own numbers below. D6 means a six-sided die.')}</p>
    <div className="calculator-fields">
      {mode.fields.map(field => <CalculatorField key={field.key} field={field} value={values[field.key] ?? ''} prefix={mode.id} disabled={disabled} onChange={value => onChange(field.key, value)}/>)}
    </div>
  </div>;
}

export function DicePreview({count, sides}: {count: string; sides: string}) {
  const {t} = useI18n();
  const number = Number(count), faces = Number(sides);
  const valid = Number.isInteger(number) && number >= 1 && number <= 100 && Number.isInteger(faces) && faces >= 2 && faces <= 1000;
  return <div className={styles.preview} data-dice-preview>
    <span className="eyebrow">{t('Ready to roll')}</span>
    {valid ? <>
      <h3 className={styles.selection}>{number} × D{faces}</h3>
      <div className={styles.tray} data-many={number > 20 || undefined} aria-hidden="true">
        {Array.from({length: number}, (_, index) => <span className={styles.die} data-die data-die-sides={faces} key={index}><DiceFace sides={faces}/></span>)}
      </div>
      <p>{t('Select Roll dice to see each die and the total.')}</p>
    </> : <p>{t('Enter 1–100 dice and 2–1,000 sides per die.')}</p>}
  </div>;
}

export function DiceRoll({dice}: {dice: NonNullable<Result['dice']>}) {
  const {t} = useI18n();
  return <div className={styles.roll} data-dice-result>
    <p className={styles.rollSummary}>{dice.values.length} × D{dice.sides}</p>
    <ol className={styles.tray} data-many={dice.values.length > 20 || undefined} aria-label={t('Individual dice')}>
      {dice.values.map((value, index) => <li className={styles.die} key={index} data-die data-die-value={value} data-die-sides={dice.sides}>
        <span className="sr-only">{t('Die')} {index + 1}: {value}</span>
        <DiceFace sides={dice.sides} value={value}/>
      </li>)}
    </ol>
  </div>;
}
