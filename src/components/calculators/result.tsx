'use client';
import {memo} from 'react';
import {Check} from 'lucide-react';
import {useI18n} from '@/components/i18n/provider';
import type {Result} from '@/lib/calculators/types';
import {formatMetric} from '@/lib/calculators/format-metric';
import {languages} from '@/lib/i18n/config';
import {ResultDetails} from './result-details';

export const CalculatorResult=memo(function CalculatorResult({result,currency='USD',example=false,currencyLabels=true,showDetails=true,algorithm=''}:{result:Result;currency?:string;example?:boolean;currencyLabels?:boolean;showDetails?:boolean;algorithm?:string}) {
  const {t,locale,messages}=useI18n();
  return <div className="calculator-results">
    <div className="result-heading"><span className="eyebrow">{example?t('EXAMPLE RESULT'):t('YOUR RESULT')}</span><span className="result-method"><Check size={14} aria-hidden="true"/>{t('Calculated locally')}</span></div>
    <dl className="result-metrics">{result.metrics.map((metric,index)=><div className={`metric ${index===0?'primary-metric':''}`} data-text={typeof metric.value==='string'||undefined} key={index}>
      <dt>{t(metric.label)}</dt><dd>{typeof metric.value==='string'?metric.value:formatMetric({...metric,unit:metric.unit?t(metric.unit):undefined},currency,languages[locale].tag)}</dd>
    </div>)}</dl>
    {(result.explanation||result.notes?.length)?<div className="result-notes"><h3>{t('About this result')}</h3>
      {result.explanation&&<p lang={messages[result.explanation]?locale:'en'} dir="auto">{t(result.explanation)}</p>}
      {result.notes?.map((note,index)=><p key={index} lang={messages[note]?locale:'en'} dir="auto">{t(note)}</p>)}
    </div>:null}
    {showDetails&&<ResultDetails result={result} algorithm={algorithm} currency={currency} currencyLabels={currencyLabels}/>}
  </div>;
});
