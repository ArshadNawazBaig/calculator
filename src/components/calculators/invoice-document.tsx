'use client';

import {useEffect, useId, useRef, useState} from 'react';
import NextImage from 'next/image';
import {FileDown, FileText, Upload, X} from 'lucide-react';
import {calculateInvoice} from '@/lib/calculators/toolkit-engine';
import type {Values} from '@/lib/calculators/types';
import {downloadFile, releaseDownload} from '@/lib/exports/results';
import {Button} from '@/components/ui/button';
import {Dropdown} from '@/components/ui/dropdown';
import {ResultSection} from './result-section';
import {ResultDataTable} from './result-table';
import styles from './toolkit.module.css';

export function InvoiceDocument({values, currency, example}: {values: Values; currency: string; example: boolean}) {
  const doc = calculateInvoice(values);
  const [logo, setLogo] = useState(''), [logoName, setLogoName] = useState(''), [accent, setAccent] = useState('brand'), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const logoInput = useRef<HTMLInputElement>(null), colorId = useId();
  const [file, setFile] = useState<{url: string; name: string} | null>(null);
  const operation = useRef<AbortController | null>(null), url = useRef<string | null>(null), logoRead = useRef(0);
  useEffect(() => () => {operation.current?.abort(); logoRead.current++; if (url.current) releaseDownload(url.current);}, []);
  const amount = (value: number) => new Intl.NumberFormat('en', {style: 'currency', currency, minimumFractionDigits: doc.precision, maximumFractionDigits: doc.precision}).format(value === 0 ? 0 : value);
  const totals: [string, number][] = [['Subtotal', doc.subtotal], ['Discount', -doc.discount], ['Shipping', doc.shipping], ['Tax', doc.tax], ['Document total', doc.total], ['Amount already paid', doc.paid], ['Balance due', doc.balance]];
  async function readLogo(file?: File) {
    const token = ++logoRead.current;
    setMessage(''); setFile(null);
    if (!file) {setLogo(''); setLogoName(''); return;}
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 2_000_000) {setMessage('Choose a PNG or JPEG logo smaller than 2 MB.'); return;}
    try {
      const data = await new Promise<string>((resolve, reject) => {const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);});
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = data;});
      if (image.naturalWidth * image.naturalHeight > 16_000_000) throw Error('Logo dimensions are too large.');
      if (token === logoRead.current) {setLogo(data); setLogoName(file.name);}
    } catch {if (token === logoRead.current) setMessage('This logo could not be read. Try a smaller PNG or JPEG.');}
  }
  async function pdf() {
    operation.current?.abort();
    const controller = new AbortController(); operation.current = controller;
    setBusy(true); setMessage(''); setFile(null);
    try {
      const {resultPdf} = await import('@/lib/exports/pdf');
      const blob = await resultPdf({title: doc.business, subtitle: `${doc.type} ${doc.number}`, caption: `${example ? 'EXAMPLE DOCUMENT — replace sample details before sharing.\n' : ''}Issued: ${doc.issueDate} | ${doc.type === 'Invoice' ? 'Payment due' : 'Valid until'}: ${doc.dueDate}\nCurrency: ${currency}`,
        metrics: [['From', `${doc.business}\n${doc.businessDetails}`], ['Bill to', `${doc.customer}\n${doc.customerDetails}`], ...totals.map(([label, value]) => [label, amount(value)])],
        table: [['Description', 'Quantity', 'Unit price', 'Amount'], ...doc.items.map(item => [item.description, String(item.quantity), amount(item.rate), amount(item.total)])],
        tableTitle: 'Line items', notes: [], footer: doc.terms, direction: 'ltr', locale: 'en', fontFamily: getComputedStyle(document.body).fontFamily,
        brand: {name: doc.business, accent: getComputedStyle(document.body).getPropertyValue(`--color-${accent}`).trim(), ...(logo ? {logo} : {})},
      }, controller.signal);
      controller.signal.throwIfAborted();
      const name = `${doc.type.toLowerCase()}-${doc.number.replace(/[^a-z0-9_-]+/gi, '-').slice(0, 80) || 'document'}.pdf`;
      if (url.current) releaseDownload(url.current);
      url.current = URL.createObjectURL(blob); setFile({url: url.current, name}); downloadFile(url.current, name);
    } catch {if (!controller.signal.aborted) setMessage('The PDF could not be prepared. Please try again.');}
    finally {if (!controller.signal.aborted) setBusy(false);}
  }
  return <ResultSection titleId="invoice-preview-heading" title={`${doc.type} preview`} icon={<FileText size={19} aria-hidden="true"/>}
    description="Review your document, add your logo, and download a PDF."
    action={<Button type="button" variant="secondary" onClick={pdf} disabled={busy}><FileDown size={16} aria-hidden="true"/>{busy ? 'Preparing PDF…' : `Download ${doc.type.toLowerCase()} PDF`}</Button>}>
    <div className={styles.body}>
    <div className={styles.brandControls}>
      <div className="calculator-field"><span className={styles.fieldLabel}>Logo (optional PNG or JPEG)</span><div className={styles.uploadActions}>
        <Button type="button" variant="secondary" disabled={busy} onClick={() => logoInput.current?.click()}><Upload size={16} aria-hidden="true"/>{logo ? 'Replace logo' : 'Upload logo'}</Button>
        {logo && <Button type="button" variant="ghost" disabled={busy} onClick={() => void readLogo()}><X size={16} aria-hidden="true"/>Remove logo</Button>}
      </div><input ref={logoInput} hidden type="file" accept="image/png,image/jpeg" aria-label="Logo (optional PNG or JPEG)" disabled={busy} onChange={event => {void readLogo(event.target.files?.[0]); event.target.value = '';}}/>
        <p className={styles.fileName}>{logoName || 'PNG or JPEG, up to 2 MB.'}</p>
      </div>
      <div className="calculator-field"><label id={`${colorId}-label`} htmlFor={colorId}>Brand color</label><Dropdown id={colorId} aria-labelledby={`${colorId}-label`} value={accent} disabled={busy} onValueChange={value => {setAccent(value); setFile(null);}} options={[{value:'brand',label:'Finflo green'},{value:'brand-dark',label:'Dark green'},{value:'ink',label:'Ink'}]}/></div>
      <p className={styles.brandNote}>Logo and color apply to this preview and PDF. Reattach your logo after changing inputs or reopening a saved document.</p>
    </div>
    {example && <p className="stale-note">Example document. Enter your details and select Calculate before sharing.</p>}
    <div className={styles.invoice} style={{borderTopColor: `var(--color-${accent})`}}>
      <div className={styles.parties}><div>{/* Local user-selected image; never fetched remotely. */}{logo && <NextImage unoptimized src={logo} alt="Business logo" width={150} height={60} className={styles.logo}/>}<h3>{doc.business}</h3><p>{doc.businessDetails}</p></div><div><h3>{doc.type} {doc.number}</h3><p>Issued: {doc.issueDate}<br/>{doc.type === 'Invoice' ? 'Payment due' : 'Valid until'}: {doc.dueDate}<br/>Currency: {currency}</p></div></div>
      <div className={styles.customer}><strong>Bill to</strong><p>{doc.customer}<br/>{doc.customerDetails}</p></div>
      <ResultDataTable label="Invoice line items" caption={`${doc.type} ${doc.number} line items`}><thead><tr><th scope="col">Description</th><th scope="col" data-money>Quantity</th><th scope="col" data-money>Unit price</th><th scope="col" data-money>Amount</th></tr></thead><tbody>{doc.items.map((item, i) => <tr key={i}><td>{item.description}</td><td data-numeric data-money>{item.quantity}</td><td data-numeric data-money>{amount(item.rate)}</td><td data-numeric data-money>{amount(item.total)}</td></tr>)}</tbody></ResultDataTable>
      <dl className={styles.totals}>{totals.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{amount(value)}</dd></div>)}</dl>
      {doc.terms && <div className={styles.terms}><strong>Terms & notes</strong><p>{doc.terms}</p></div>}
    </div>
    {message && <p className="form-error" role="alert">{message}</p>}{file && <p className={styles.status} role="status">Your PDF is ready. <a className="text-link" href={file.url} download={file.name}>Download again</a></p>}
    </div>
  </ResultSection>;
}
