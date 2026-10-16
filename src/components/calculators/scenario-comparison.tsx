'use client';
import {useState} from 'react';
import {GitCompareArrows} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {ResultSection} from './result-section';
import {useI18n} from '@/components/i18n/provider';
import {languages} from '@/lib/i18n/config';
import type {Metric} from '@/lib/calculators/types';
import type {SavedInput} from '@/lib/workspace/model';
import {compareMetrics} from '@/lib/scenario-comparison';
import {formatMetric} from '@/lib/calculators/format-metric';
import copy from '@/data/locales/explanations.json';
import styles from '@/components/content/explanation.module.css';

type Scenario = {metrics: Metric[]; inputs: SavedInput[]};
export function ScenarioComparison({current, currency}: {current: Scenario|null; currency: string}) {
  const {locale,t} = useI18n(), text = copy[locale];
  const [baseline, setBaseline] = useState<Scenario|null>(null);
  if (!baseline && (!current || !current.metrics.some(metric => typeof metric.value === 'number' && Number.isFinite(metric.value) && !metric.displayValue && !metric.numericText))) return null;
  const rows = baseline && current ? compareMetrics(baseline.metrics, current.metrics) : [];
  const changed = baseline && current ? [...new Set([...baseline.inputs, ...current.inputs].map(input => input.key))].flatMap(key => {
    const before = baseline.inputs.find(input => input.key === key), after = current.inputs.find(input => input.key === key);
    return before?.value === after?.value && before?.unit === after?.unit ? [] : [{key,before,after}];
  }) : [];
  const format = (metric: Metric) => formatMetric({...metric, unit: metric.unit ? t(metric.unit) : undefined}, currency, languages[locale].tag, t);
  const inputValue = (input: SavedInput|undefined) => input ? `${input.value}${input.unit ? ` ${input.unit}` : ''}` : '—';
  return <div data-scenario-comparison><ResultSection titleId="scenario-heading" title={text.compareTitle} description={text.compareIntro} icon={<GitCompareArrows size={20} aria-hidden="true"/>}>
    <div className={styles.comparisonBody}>
    <div className={styles.actions}><Button type="button" variant="secondary" disabled={!current} onClick={() => current && setBaseline(structuredClone(current))}>{baseline ? text.replace : text.pin}</Button>{baseline && <Button type="button" variant="ghost" onClick={() => setBaseline(null)}>{text.clear}</Button>}</div>
    {baseline && !current && <p role="status">{text.recalculate}</p>}
    {baseline && current && <>
      {rows.length ? <div className={styles.scroll} role="region" aria-label={text.compareTitle} tabIndex={0}><table className={styles.table}><caption className="sr-only">{text.compareTitle}</caption><thead><tr><th scope="col">{text.metric}</th><th scope="col">{text.baseline}</th><th scope="col">{text.current}</th><th scope="col">{text.difference}</th></tr></thead><tbody>{rows.map(({previous,current:metric,difference}) => <tr key={metric.label}><th scope="row">{t(metric.label)}</th><td dir="auto">{format(previous)}</td><td dir="auto">{format(metric)}</td><td dir="auto">{difference > 0 ? '+' : ''}{format({...metric,value:difference,...(metric.format === 'percent' ? {format:'number' as const,unit:text.points} : {})})}</td></tr>)}</tbody></table></div> : <p role="status">{text.incompatible}</p>}
      {changed.length ? <><h3>{text.changedInputs}</h3><div className={styles.scroll} role="region" aria-label={text.changedInputs} tabIndex={0}><table className={styles.table}><thead><tr><th scope="col">{text.inputStep}</th><th scope="col">{text.baseline}</th><th scope="col">{text.current}</th></tr></thead><tbody>{changed.map(({key,before,after}) => <tr key={key}><th scope="row">{after?.label || before?.label}</th><td dir="auto">{inputValue(before)}</td><td dir="auto">{inputValue(after)}</td></tr>)}</tbody></table></div></> : <p>{text.sameInputs}</p>}
    </>}
    </div>
  </ResultSection></div>;
}
