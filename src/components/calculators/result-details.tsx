'use client';
import {memo,useMemo} from 'react';
import {useI18n} from '@/components/i18n/provider';
import type {Result} from '@/lib/calculators/types';
import {resultPresentation} from '@/lib/calculators/result-presentation';
import {ResultCharts} from './result-charts';
import {ResultTable} from './result-table';

export const ResultDetails=memo(function ResultDetails({result,algorithm,currency,currencyLabels,dirty=false}: {result:Result;algorithm:string;currency:string;currencyLabels:boolean;dirty?:boolean}) {
  const {t}=useI18n();
  const presentation=useMemo(()=>resultPresentation(result,algorithm),[result,algorithm]);
  if(!result.table&&!presentation.series&&!presentation.breakdown)return null;
  return <div className="result-detail-sections">
    {dirty&&<p className="stale-note">{t('Inputs changed. Select Calculate to update the result.')}</p>}
    <ResultCharts series={presentation.series} breakdown={presentation.breakdown} currency={currency}/>
    {result.table&&<ResultTable table={result.table} currency={currency} currencyLabels={currencyLabels} moneyColumns={presentation.moneyColumns}/>}
  </div>;
});
