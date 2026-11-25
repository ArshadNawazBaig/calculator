import Image from 'next/image';
import {calculatorVisual} from '@/lib/calculator-visual';
import type {Mode} from '@/lib/calculators/types';
import {translator, type Dictionary, type Locale} from '@/lib/i18n/config';
import styles from './calculator-visual.module.css';

/** A visual introduction to the calculator's first named method. */
export function CalculatorVisual({slug, title, mode, locale = 'en', messages = {}}: {
  slug: string; title: string; mode?: Mode; locale?: Locale; messages?: Dictionary;
}) {
  const visual = calculatorVisual(slug, locale, title);
  if (!visual) return null;
  const t = translator(messages);
  return <figure className={styles.figure} data-calculator-visual={slug}>
    <Image className={styles.image} src={visual.src} overrideSrc={visual.src} width={visual.width} height={visual.height}
      alt={visual.alt} sizes="auto, (max-width: 860px) calc(100vw - 36px), 820px" loading="lazy"/>
    {mode && <figcaption className={styles.caption}>
      <strong>{t(mode.title)}</strong><span dir="auto">{t(mode.formula)}</span>
    </figcaption>}
  </figure>;
}
