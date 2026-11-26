'use client';
import {useEffect, useId, useState, type ReactNode} from 'react';
import {flushSync} from 'react-dom';
import {Table2,MoveHorizontal} from 'lucide-react';
import {useI18n} from '@/components/i18n/provider';
import {languages} from '@/lib/i18n/config';
import {currencyText} from '@/lib/i18n/preferences';
import {number,money,currencyDigits} from '@/lib/format';
import {useHydrated} from '@/lib/use-hydrated';
import {Button} from '@/components/ui/button';
import type {Result} from '@/lib/calculators/types';
import {ResultSection} from './result-section';
import styles from './result-table.module.css';

export function ResultDataTable({label, caption, children}: {label: string; caption: ReactNode; children: ReactNode}) {
  return <div className={`table-scroll ${styles.scroll}`} tabIndex={0} role="region" aria-label={label}>
    <table className={styles.table}><caption className="sr-only">{caption}</caption>{children}</table>
  </div>;
}

export function ResultTable({table,currency,currencyLabels,moneyColumns=[],previewRows}: {table:NonNullable<Result['table']>;currency:string;currencyLabels:boolean;moneyColumns?:number[];previewRows?:number}) {
  const {t,locale} = useI18n();
  const titleId = useId();
  const hydrated = useHydrated();
  const [expanded, setExpanded] = useState(false);
  const [printing, setPrinting] = useState(false);
  const hasPreview = previewRows !== undefined && table.rows.length > previewRows;
  useEffect(() => {
    if (!hasPreview) return;
    // The browser takes its print snapshot before a batched React update commits.
    const beforePrint = () => flushSync(() => setPrinting(true));
    const afterPrint = () => setPrinting(false);
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, [hasPreview]);
  const preview = hasPreview && !expanded && !printing;
  const rows = preview ? table.rows.slice(0, previewRows) : table.rows;
  const rowCount = number(table.rows.length, 0, languages[locale].tag);
  const previewCount = number(rows.length, 0, languages[locale].tag);
  const summary = preview ? t('Showing {shown} of {total} rows', {shown: previewCount, total: rowCount}) : t('All {count} rows', {count: rowCount});
  const precision = table.moneyDigits ?? currencyDigits(currency,languages[locale].tag);
  const amountFormatter = new Intl.NumberFormat(locale==='ar'?'ar-u-nu-arab':languages[locale].tag,{minimumFractionDigits:precision,maximumFractionDigits:precision});
  return <ResultSection id="calculation-table" titleId={titleId} title={t('Detailed breakdown')} icon={<Table2 size={19} aria-hidden="true"/>}
    action={hasPreview ? <Button type="button" variant="secondary" disabled={!hydrated} aria-expanded={expanded} aria-controls={titleId+'-rows'} onClick={() => setExpanded(!expanded)}>
      {expanded ? t('Show first {count} payments', {count: number(previewRows, 0, languages[locale].tag)}) : t('Show all {count} payments', {count: rowCount})}
    </Button> : summary}
    description={<>{hasPreview ? summary : t('The complete calculation, row by row.')}{currencyLabels&&<> {t('Amounts in {currency}.',{currency})}</>}</>}
    hint={<><MoveHorizontal size={15} aria-hidden="true"/>{t('Swipe or scroll horizontally for more columns.')}</>}>
    <ResultDataTable label={t('Detailed calculation results')} caption={<>{t('Detailed breakdown')} · {summary}</>}>
        <thead><tr>{table.headers.map((header,index)=><th key={index} scope="col" data-money={currencyLabels&&moneyColumns.includes(index)||undefined}>{currencyLabels?currencyText(t(header),currency):t(header)}</th>)}</tr></thead>
        <tbody id={titleId+'-rows'}>{rows.map((row,rowIndex)=><tr key={rowIndex}>{row.map((cell,columnIndex)=>{
          const isMoney=typeof cell==='number'&&currencyLabels&&moneyColumns.includes(columnIndex);
          return <td key={columnIndex} data-numeric={typeof cell==='number'||undefined} data-money={isMoney||undefined} title={isMoney?money(cell as number,currency,precision,languages[locale].tag):undefined}>{typeof cell==='number'?(isMoney?amountFormatter.format(Math.abs(cell)<.5*10**(-precision)?0:cell):number(cell,undefined,languages[locale].tag)):table.translateColumns?.includes(columnIndex)?t(cell):cell}</td>;
        })}</tr>)}</tbody>
    </ResultDataTable>
    {table.rows.length===0&&<p className={styles.empty}>{t('No rows for these inputs.')}</p>}
  </ResultSection>;
}
