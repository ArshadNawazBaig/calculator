'use client';

import {useEffect, useRef, useState} from 'react';
import {ArrowRight, Download, FolderHeart, GitCompareArrows, Pencil, Star, Trash2, Upload, X} from 'lucide-react';
import Link from '@/components/i18n/link';
import {useI18n} from '@/components/i18n/provider';
import {PageHero} from '@/components/content/page-hero';
import {CalculatorCard, type CalculatorCardData} from '@/components/calculators/calculator-card';
import {Button} from '@/components/ui/button';
import {useHydrated} from '@/lib/use-hydrated';
import {languages} from '@/lib/i18n/config';
import {number} from '@/lib/format';
import {formatMetric} from '@/lib/calculators/format-metric';
import type {Metric} from '@/lib/calculators/types';
import {downloadFile, releaseDownload} from '@/lib/exports/results';
import {canCompare, comparableMetric, maxBackupLength, type SavedCalculation} from '@/lib/workspace/model';
import {clearWorkspace, deleteCalculation, importWorkspace, renameCalculation, useWorkspace, type WriteResult} from '@/lib/workspace/store';
import styles from './workspace.module.css';

function SavedCard({item, selected, onSelect, onMessage}: {item: SavedCalculation; selected: boolean; onSelect: () => void; onMessage: (result: WriteResult, success: string) => void}) {
  const {t, locale} = useI18n();
  const [editing, setEditing] = useState(false), [name, setName] = useState(item.name), [deleting, setDeleting] = useState(false);
  const metric = item.metrics[0];
  const translate = (value: string) => t(value) !== value ? t(value) : Object.hasOwn(item.labels, value) ? item.labels[value] : value;
  return <article className={styles.savedCard} data-saved-calculation={item.id}>
    <div className={styles.savedTop}><span>{item.title}</span><time dateTime={item.createdAt}>{new Intl.DateTimeFormat(languages[locale].tag, {dateStyle: 'medium'}).format(new Date(item.createdAt))}</time></div>
    {editing ? <form className={styles.rename} onSubmit={event => {event.preventDefault();const result = renameCalculation(item.id, name);onMessage(result, 'Calculation renamed.');if (result.ok) setEditing(false);}}>
      <label className="sr-only" htmlFor={`rename-${item.id}`}>{t('Calculation name')}</label>
      <input id={`rename-${item.id}`} value={name} onChange={event => setName(event.target.value)} maxLength={80} required autoFocus/>
      <Button type="submit" variant="secondary" disabled={!name.trim()}>{t('Save name')}</Button>
      <Button type="button" variant="ghost" onClick={() => setEditing(false)}>{t('Cancel')}</Button>
    </form> : <h3>{item.name}</h3>}
    <p className={styles.mode}>{item.modeTitle}{item.currencyLabels ? ` · ${item.currency}` : ''}</p>
    <dl className={styles.summary}><dt>{translate(metric.label)}</dt><dd dir="auto">{formatMetric({...metric, unit: metric.unit ? translate(metric.unit) : undefined}, item.currency, languages[locale].tag, translate)}</dd></dl>
    <div className={styles.cardActions}>
      <Link href={`/${item.slug}#saved=${item.id}`} className={styles.workspaceLink}>{t('Open calculation')}<ArrowRight size={15} aria-hidden="true"/></Link>
      <label className={styles.compareCheckbox}><input type="checkbox" checked={selected} onChange={onSelect}/>{t('Compare')}</label>
    </div>
    <div className={styles.editActions}>
      <button type="button" onClick={() => {setName(item.name);setEditing(true);}}><Pencil size={14} aria-hidden="true"/>{t('Rename')}</button>
      <button type="button" onClick={() => setDeleting(true)}><Trash2 size={14} aria-hidden="true"/>{t('Delete')}</button>
    </div>
    {deleting && <div className={styles.confirm}>
      <p>{t('Delete this saved calculation?')}</p>
      <Button type="button" variant="secondary" onClick={() => onMessage(deleteCalculation(item.id), 'Calculation deleted.')}>{t('Delete calculation')}</Button>
      <Button type="button" variant="ghost" onClick={() => setDeleting(false)}>{t('Cancel')}</Button>
    </div>}
  </article>;
}

function Comparison({items, onRemove}: {items: SavedCalculation[]; onRemove: (id: string) => void}) {
  const {t, locale} = useI18n(), tag = languages[locale].tag;
  const first = items[0];
  const rows = [...new Set(items.flatMap(item => item.metrics.map(metric => metric.label)))];
  const inputKeys = [...new Set(items.flatMap(item => item.inputs.map(input => input.key)))];
  function translate(item: SavedCalculation, value: string) {return t(value) !== value ? t(value) : Object.hasOwn(item.labels, value) ? item.labels[value] : value;}
  function difference(base: Metric | undefined, metric: Metric, item: SavedCalculation) {
    if (!base || !comparableMetric(base, metric)) return null;
    const change = Number(metric.value) - Number(base.value);
    if (!Number.isFinite(change)) return null;
    if (change === 0) return <small>{t('No change')}</small>;
    const value = metric.format === 'percent' ? `${change > 0 ? '+' : ''}${number(change, metric.digits, tag)} ${t('percentage points')}`
      : `${change > 0 ? '+' : ''}${formatMetric({...metric, value: change, unit: metric.unit ? translate(item, metric.unit) : undefined}, item.currency, tag)}`;
    return <small>{value}</small>;
  }
  return <section className={styles.comparison} aria-labelledby="comparison-heading">
    <div className={styles.sectionHeading}><div><span className="eyebrow">{t('SIDE BY SIDE')}</span><h2 id="comparison-heading">{t('Compare scenarios')}</h2></div><GitCompareArrows size={24} aria-hidden="true"/></div>
    <p className={styles.hint}>{t('Compare up to three saved results from the same calculator, mode, and currency. Differences are measured against the first scenario.')}</p>
    <div className={styles.tableScroll} tabIndex={0} role="region" aria-label={t('Scenario comparison')}>
      <table><caption className="sr-only">{t('Saved results and input differences')}</caption>
        <thead><tr><th scope="col">{t('Result')}</th>{items.map((item, index) => <th scope="col" key={item.id}><span>{item.name}</span>{index === 0 && <small>{t('Baseline')}</small>}<button type="button" aria-label={t('Remove {name} from comparison', {name: item.name})} onClick={() => onRemove(item.id)}><X size={16} aria-hidden="true"/></button></th>)}</tr></thead>
        <tbody>{rows.map(label => {
          const base = first.metrics.find(metric => metric.label === label);
          const units = items.map(item => item.metrics.find(metric => metric.label === label)?.unit);
          const changed = items.some(item => JSON.stringify(item.metrics.find(metric => metric.label === label)) !== JSON.stringify(base));
          return <tr key={label} data-different={changed || undefined}><th scope="row">{translate(first, label)}</th>{items.map((item, index) => {
            const metric = item.metrics.find(metric => metric.label === label);
            return <td key={item.id}>{metric ? <>{formatMetric({...metric, unit: metric.unit ? translate(item, metric.unit) : undefined}, item.currency, tag, value => translate(item, value))}{index > 0 && units.every(unit => unit === units[0]) && difference(base, metric, item)}</> : '—'}</td>;
          })}</tr>;
        })}</tbody>
      </table>
    </div>
    <details className={styles.inputDetails}><summary>{t('Compare inputs')}</summary>
      <div className={styles.tableScroll} tabIndex={0} role="region" aria-label={t('Input comparison')}><table><thead><tr><th scope="col">{t('Your inputs')}</th>{items.map(item => <th key={item.id} scope="col">{item.name}</th>)}</tr></thead><tbody>{inputKeys.map(key => {
        const inputs = items.map(item => item.inputs.find(input => input.key === key));
        const changed = inputs.some(input => input?.value !== inputs[0]?.value || input?.unit !== inputs[0]?.unit);
        return <tr key={key} data-different={changed || undefined}><th scope="row">{inputs.find(Boolean)?.label}</th>{inputs.map((input, index) => <td key={items[index].id}>{input ? `${input.value}${input.unit ? ` ${input.unit}` : ''}` : '—'}</td>)}</tr>;
      })}</tbody></table></div>
    </details>
    <p className={styles.hint}>{t('Saved results reflect their original calculation date. Reopen a calculation to update rates or assumptions.')}</p>
  </section>;
}

export function WorkspacePage({tools}: {tools: CalculatorCardData[]}) {
  const {t} = useI18n(), hydrated = useHydrated(), {data, error} = useWorkspace();
  const [selected, setSelected] = useState<string[]>([]), [message, setMessage] = useState(''), [clear, setClear] = useState(false);
  const [backup, setBackup] = useState<string | null>(null), [importing, setImporting] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const items = selected.flatMap(id => data.calculations.find(item => item.id === id) ?? []);
  const favorites = tools.filter(tool => data.favorites.includes(tool.slug));
  useEffect(() => () => {if (backup) releaseDownload(backup);}, [backup]);
  function report(result: WriteResult, success: string) {
    setMessage(result.ok ? success : result.error === 'limit' ? 'This calculation or workspace is too large. Export a backup and remove old calculations.'
      : result.error === 'backup' ? 'This file is not a valid Finflo workspace backup. Your saved items were not changed.'
      : 'Unable to save. Check browser storage or open My workspace.');
  }
  function select(item: SavedCalculation) {
    if (selected.includes(item.id)) {setSelected(selected.filter(id => id !== item.id));return;}
    if (items.length >= 3) {setMessage('Select up to three scenarios. Remove one to add another.');return;}
    if (items.length && !canCompare(items[0], item)) {setMessage('Choose calculations with the same calculator, mode, and currency.');return;}
    setSelected([...items.map(item => item.id), item.id]);setMessage('');
  }
  function exportBackup() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data)], {type: 'application/json'}));
    setBackup(url);
    try {downloadFile(url, 'finflo-workspace.json');} catch { /* The visible link remains available. */ }
  }
  async function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];event.target.value = '';
    if (!file) return;
    if (file.size > maxBackupLength * 3) {report({ok: false, error: 'backup'}, '');return;}
    setImporting(true);
    try {report(importWorkspace(await file.text()), 'Backup imported. Existing saved items were kept.');}
    catch {report({ok: false, error: 'backup'}, '');}
    finally {setImporting(false);}
  }
  return <>
    <PageHero eyebrow="FINFLO" title={t('My workspace')} description={t('Your favorite tools, saved calculations, and scenarios in one place.')} breadcrumbs={[{label: t('My workspace')}]}/>
    <div className={`container page-content ${styles.workspace}`}>
      <div className={styles.deviceNote}><FolderHeart size={22} aria-hidden="true"/><p>{t('Saved only in this browser. Clear site data and your saved items will be removed.')} {t('Export a backup to keep a copy or move your workspace to another device.')}</p></div>
      {error && <p role="alert" className={styles.error}>{t(error === 'storage' ? 'Browser storage is unavailable. Enable site storage to save your workspace.' : 'Saved data could not be read. Import a backup or clear workspace data.')}</p>}
      <div className={styles.backupActions}>
        <Button type="button" variant="secondary" disabled={!hydrated || Boolean(error) || !data.favorites.length && !data.calculations.length} onClick={exportBackup}><Download size={16} aria-hidden="true"/>{t('Export backup')}</Button>
        <Button type="button" variant="ghost" disabled={!hydrated || importing || error === 'storage'} onClick={() => input.current?.click()}><Upload size={16} aria-hidden="true"/>{t(importing ? 'Importing…' : 'Import backup')}</Button>
        <input ref={input} type="file" accept="application/json,.json" hidden onChange={importBackup} aria-label={t('Import backup')}/>
        <Button type="button" variant="ghost" disabled={!hydrated || error === 'storage'} onClick={() => setClear(true)}>{t('Clear workspace')}</Button>
        {backup && <a className={styles.workspaceLink} href={backup} download="finflo-workspace.json">{t('Download backup')}</a>}
      </div>
      {clear && <div className={styles.confirm}><p>{t('Remove all favorites and saved calculations from this browser? Export a backup first if you want to keep them.')}</p><Button type="button" variant="secondary" onClick={() => {const result = clearWorkspace();report(result, 'Workspace cleared.');if (result.ok) {setClear(false);setSelected([]);setBackup(null);}}}>{t('Remove saved data')}</Button><Button type="button" variant="ghost" onClick={() => setClear(false)}>{t('Cancel')}</Button></div>}
      <p role="status" className={styles.status}>{message && t(message)}</p>
      {!hydrated ? <p>{t('Loading workspace…')}</p> : <>
        <section aria-labelledby="favorites-heading"><div className={styles.sectionHeading}><h2 id="favorites-heading">{t('Favorites')} <span>{favorites.length}</span></h2><Star size={22} aria-hidden="true"/></div>
          {favorites.length ? <div className={styles.favorites}>{favorites.map(tool => <CalculatorCard key={tool.slug} tool={tool} size="compact"/>)}</div>
            : <div className={styles.empty}><h3>{t('Keep your go-to tools close.')}</h3><p>{t('Select the star on any calculator to find it here.')}</p><Link href="/calculators" className={styles.workspaceLink}>{t('Browse all calculators')}<ArrowRight size={16} aria-hidden="true"/></Link></div>}
        </section>
        <section aria-labelledby="saved-heading"><div className={styles.sectionHeading}><h2 id="saved-heading">{t('Saved calculations')} <span>{data.calculations.length}</span></h2>{items.length > 0 && <a href="#comparison-heading" className={styles.workspaceLink}>{t('Compare scenarios')} ({items.length})<ArrowRight size={16} aria-hidden="true"/></a>}</div>
          <p className={styles.hint}>{t('Select up to three saved calculations to compare their results and inputs.')}</p>
          {data.calculations.length ? <div className={styles.savedGrid}>{data.calculations.map(item => <SavedCard key={item.id} item={item} selected={selected.includes(item.id)} onSelect={() => select(item)} onMessage={report}/>)}</div>
            : <div className={styles.empty}><h3>{t('Give your next calculation a name.')}</h3><p>{t('Run a calculator, name the result, and choose Save calculation. It will be waiting here when you return.')}</p><Link href="/loan-calculator" className={styles.workspaceLink}>{t('Try the loan calculator')}<ArrowRight size={16} aria-hidden="true"/></Link></div>}
        </section>
        {items.length > 0 && <Comparison items={items} onRemove={id => setSelected(selected.filter(item => item !== id))}/>}
      </>}
    </div>
  </>;
}
