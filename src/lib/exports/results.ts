import type {Result} from '@/lib/calculators/types';
import {formatMetric} from '@/lib/calculators/format-metric';
import {resultPresentation} from '@/lib/calculators/result-presentation';
import {currencyDigits,number} from '@/lib/format';
import {currencyText} from '@/lib/i18n/preferences';

type Options = {currency:string; currencyLabels:boolean; locale:string; t:(value:string)=>string; algorithm?:string; localizedNumbers?:boolean};

/** Export the same result snapshot and display precision as the calculator. */
export function resultRows(result:Result, {currency,currencyLabels,locale,t,algorithm='',localizedNumbers=false}:Options) {
  const metrics = result.metrics.map(metric=>[
    t(metric.label),
    formatMetric({...metric,unit:metric.unit?t(metric.unit):undefined},currency,locale,t),
  ]);
  const moneyColumns=localizedNumbers&&currencyLabels?resultPresentation(result,algorithm).moneyColumns:[];
  const precision=currencyDigits(currency,locale);
  const amounts=new Intl.NumberFormat(locale==='ar'?'ar-u-nu-arab':locale,{minimumFractionDigits:precision,maximumFractionDigits:precision});
  const table = result.table && [
    result.table.headers.map(header=>currencyLabels?currencyText(t(header),currency):t(header)),
    ...result.table.rows.map(row=>row.map((value,index)=>typeof value==='number'
      ? moneyColumns.includes(index)?amounts.format(Math.abs(value)<.5*10**(-precision)?0:value):number(value,undefined,localizedNumbers?locale:'en-US',localizedNumbers)
      : result.table?.translateColumns?.includes(index)?t(value):value)),
  ];
  return {metrics,table};
}

export function resultCsv(result:Result, options:Options):Blob {
  const {metrics,table} = resultRows(result,{...options,localizedNumbers:false});
  const rows = table ?? [[options.t('Result'),options.t('Value')],...metrics];
  if(options.currencyLabels)rows.unshift([options.t('Currency'),options.currency]);
  const cell = (value:string) => `"${value.replace(/"/g,'""')}"`;
  return new Blob(['\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
}

/** Keep the URL alive for both the download and the visible save/retry link. */
export function downloadFile(url:string, name:string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.target = '_blank';
  anchor.rel = 'noopener';
  anchor.hidden = true;
  document.body.append(anchor);
  try { anchor.click(); } finally { anchor.remove(); }
}

// An in-flight mobile download may still be reading a retired URL.
export function releaseDownload(url:string) {
  window.setTimeout(()=>URL.revokeObjectURL(url),60_000);
}
