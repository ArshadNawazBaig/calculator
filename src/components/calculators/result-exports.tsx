'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {Download,FileDown,Printer,Share2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useI18n} from '@/components/i18n/provider';
import {languages} from '@/lib/i18n/config';
import type {Result} from '@/lib/calculators/types';
import {downloadFile,releaseDownload,resultCsv,resultRows} from '@/lib/exports/results';
import styles from './result-exports.module.css';

type Snapshot = {result:Result;title:string;modeTitle:string;algorithm:string;currency:string;currencyLabels:boolean;example:boolean;dirty:boolean};
type ReadyFile = {file:File;url:string;shareable:boolean;snapshot:Snapshot};

export function ResultExports({result,title,modeTitle,algorithm,slug,currency,currencyLabels,example,dirty,disabled}:Snapshot&{slug:string;disabled:boolean}) {
  const {t,locale}=useI18n();
  const snapshot=useMemo(()=>({result,title,modeTitle,algorithm,currency,currencyLabels,example,dirty}),[result,title,modeTitle,algorithm,currency,currencyLabels,example,dirty]);
  const [ready,setReady]=useState<ReadyFile|null>(null);
  const [preparing,setPreparing]=useState<Snapshot|null>(null);
  const [message,setMessage]=useState<{snapshot:Snapshot;text:string}|null>(null);
  const [sharing,setSharing]=useState(false);
  const current=ready?.snapshot===snapshot?ready:null;
  const busy=preparing===snapshot;
  const urlRef=useRef<string|null>(null);
  const operation=useRef<AbortController|null>(null);
  const options={currency,currencyLabels,locale:languages[locale].tag,t};
  useEffect(()=>()=>{
    operation.current?.abort();
    if(urlRef.current)releaseDownload(urlRef.current);
    urlRef.current=null;
  },[snapshot]);

  function prepare(blob:Blob,extension:'csv'|'pdf') {
    const file=new File([blob],`finflo-${slug}.${extension}`,{type:blob.type});
    const url=URL.createObjectURL(file);
    if(urlRef.current)releaseDownload(urlRef.current);
    urlRef.current=url;
    let shareable=false;
    try {shareable=typeof navigator.share==='function'&&Boolean(navigator.canShare?.({files:[file]}));} catch { /* The download remains available when sharing is blocked. */ }
    setReady({file,url,shareable,snapshot});
    setMessage(null);
    // The visible link is retained even if automatic downloads are blocked.
    try {downloadFile(url,file.name);} catch { /* The user can tap Download file. */ }
  }
  function csv() {
    try {prepare(resultCsv(result,options),'csv');}
    catch {setMessage({snapshot,text:'The file could not be created. Please try again.'});}
  }
  async function pdf() {
    operation.current?.abort();
    const controller=new AbortController();
    operation.current=controller;
    setPreparing(snapshot);setMessage(null);setReady(null);
    try {
      const {resultPdf}=await import('@/lib/exports/pdf');
      controller.signal.throwIfAborted();
      const {metrics,table}=resultRows(result,{...options,algorithm,localizedNumbers:true});
      const file=await resultPdf({
        title,subtitle:t(modeTitle),caption:example?t('EXAMPLE RESULT'):t('YOUR RESULT'),
        metrics:currencyLabels?[[t('Currency'),currency],...metrics]:metrics,
        notes:[...(dirty?[t('Inputs changed. Select Calculate to update the result.')]:[]),...(result.explanation?[t(result.explanation)]:[]),...(result.notes??[]).map(note=>t(note))],
        table,tableTitle:t('Detailed breakdown'),
        footer:window.location.origin+window.location.pathname,
        direction:languages[locale].direction,locale:languages[locale].tag,
        fontFamily:getComputedStyle(document.body).fontFamily,
      },controller.signal);
      controller.signal.throwIfAborted();
      prepare(file,'pdf');
    } catch {
      if(!controller.signal.aborted)setMessage({snapshot,text:'The file could not be created. Please try again.'});
    } finally {if(operation.current===controller)setPreparing(null);}
  }
  async function share() {
    if(!current)return;
    setSharing(true);setMessage(null);
    try {await navigator.share({files:[current.file]});}
    catch(error) {
      if(!(error instanceof DOMException&&error.name==='AbortError'))setMessage({snapshot,text:'Sharing is unavailable. Use Download file instead.'});
    } finally {setSharing(false);}
  }
  function print() {
    setMessage({snapshot,text:'If printing does not open, select PDF to save a printable file.'});
    try {window.print();} catch { /* PDF is available even without a browser print service. */ }
  }
  return <div className={styles.exports}>
    <div className={styles.actions}>
      <Button type="button" variant="ghost" disabled={disabled||busy||sharing} onClick={csv}><Download size={15} aria-hidden="true"/>CSV</Button>
      <Button type="button" variant="ghost" disabled={disabled||busy||sharing} onClick={pdf}><FileDown size={15} aria-hidden="true"/>{busy?t('Preparing PDF…'):'PDF'}</Button>
      <Button type="button" variant="ghost" className={styles.print} disabled={disabled||busy||sharing} onClick={print}><Printer size={15} aria-hidden="true"/>{t('Print')}</Button>
    </div>
    {(current||busy||message?.snapshot===snapshot)&&<div className={styles.file}>
      <p role="status">{busy?t('Preparing PDF…'):message?.snapshot===snapshot?t(message.text):t('Your file is ready. If it did not download, use the options below.')}</p>
      {current&&<>
        <span className={styles.filename} dir="ltr">{current.file.name}</span>
        <div className={styles.links}>
          <a className="button button-ghost" href={current.url} download={current.file.name} target="_blank" rel="noopener">{t('Download file')}</a>
          {current.shareable&&<Button type="button" variant="ghost" disabled={sharing} onClick={share}><Share2 size={15} aria-hidden="true"/>{t('Save or share')}</Button>}
        </div>
      </>}
    </div>}
  </div>;
}
