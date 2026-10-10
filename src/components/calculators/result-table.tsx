'use client';
import {useId} from 'react';
import {Table2,MoveHorizontal} from 'lucide-react';
import {useI18n} from '@/components/i18n/provider';
import {languages} from '@/lib/i18n/config';
import {currencyText} from '@/lib/i18n/preferences';
import {number,money} from '@/lib/format';
import type {Result} from '@/lib/calculators/types';
import styles from './result-table.module.css';

export function ResultTable({table,currency,currencyLabels,moneyColumns=[]}: {table:NonNullable<Result['table']>;currency:string;currencyLabels:boolean;moneyColumns?:number[]}) {
  const {t,locale} = useI18n();
  const titleId = useId();
  const precision = new Intl.NumberFormat(languages[locale].tag,{style:'currency',currency}).resolvedOptions().maximumFractionDigits ?? 2;
  const amountFormatter = new Intl.NumberFormat(locale==='ar'?'ar-u-nu-arab':languages[locale].tag,{minimumFractionDigits:precision,maximumFractionDigits:precision});
  return <section id="calculation-table" className={`result-details ${styles.section}`} aria-labelledby={titleId}>
    <div className={styles.heading}><div><Table2 size={19} aria-hidden="true"/><h2 id={titleId}>{t('Detailed breakdown')}</h2></div><span>{t('All {count} rows',{count:number(table.rows.length,0,languages[locale].tag)})}</span></div>
    <div className={styles.meta}><p>{t('The complete calculation, row by row.')}{currencyLabels&&<> {t('Amounts in {currency}.',{currency})}</>}</p><span><MoveHorizontal size={15} aria-hidden="true"/>{t('Swipe or scroll horizontally for more columns.')}</span></div>
    <div className={`table-scroll ${styles.scroll}`} tabIndex={0} role="region" aria-label={t('Detailed calculation results')}>
      <table className={styles.table}>
        <caption className="sr-only">{t('Detailed breakdown')} · {t('All {count} rows',{count:table.rows.length})}</caption>
        <thead><tr>{table.headers.map((header,index)=><th key={index} scope="col" data-money={currencyLabels&&moneyColumns.includes(index)||undefined}>{currencyLabels?currencyText(t(header),currency):t(header)}</th>)}</tr></thead>
        <tbody>{table.rows.map((row,rowIndex)=><tr key={rowIndex}>{row.map((cell,columnIndex)=>{
          const isMoney=typeof cell==='number'&&currencyLabels&&moneyColumns.includes(columnIndex);
          return <td key={columnIndex} data-numeric={typeof cell==='number'||undefined} data-money={isMoney||undefined} title={isMoney?money(cell as number,currency,undefined,languages[locale].tag):undefined}>{typeof cell==='number'?(isMoney?amountFormatter.format(cell):number(cell,6,languages[locale].tag)):table.translateColumns?.includes(columnIndex)?t(cell):cell}</td>;
        })}</tr>)}</tbody>
      </table>
    </div>
    {table.rows.length===0&&<p className={styles.empty}>{t('No rows for these inputs.')}</p>}
  </section>;
}
