'use client';
import {useI18n} from '@/components/i18n/provider';
import {useEffect, useRef, useState} from 'react';
import {Download, Upload} from 'lucide-react';
import {Button} from '@/components/ui/button';
import type {Field} from '@/lib/calculators/types';
import {parseRecordCsv, recordCsvTemplate} from '@/lib/calculators/record-csv';
import {downloadFile, releaseDownload} from '@/lib/exports/results';

export function RecordCsvControls({field, disabled, onChange}: {field: Field; disabled: boolean; onChange: (value: string) => void}) {
  const {t}=useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const revision = useRef(0);
  useEffect(() => () => {revision.current++;}, []);
  function template() {
    const url = URL.createObjectURL(recordCsvTemplate(field.rowColumns ?? []));
    try {downloadFile(url, `finflo-${field.key}-template.csv`);} finally {releaseDownload(url);}
  }
  async function read(file?: File) {
    if (!file) return;
    const run = ++revision.current; setBusy(true); setMessage('');
    try {
      if (file.size > 200_000) throw Error('Use a CSV file smaller than 200 KB.');
      const parsed = parseRecordCsv(await file.text(), field.rowColumns ?? []);
      if (run !== revision.current) return;
      onChange(parsed); setMessage('CSV imported. Review the rows, then calculate.');
    } catch (error) {if (run === revision.current) setMessage(error instanceof Error ? error.message : 'This CSV could not be read.');}
    finally {if (run === revision.current) setBusy(false); if (fileRef.current) fileRef.current.value = '';}
  }
  return <div className="record-csv-controls"><div><Button type="button" variant="secondary" disabled={disabled || busy} onClick={() => fileRef.current?.click()}><Upload size={16} aria-hidden="true"/>{t(busy ? 'Reading CSV…' : 'Import CSV')}</Button><Button type="button" variant="ghost" disabled={disabled || busy} onClick={template}><Download size={16} aria-hidden="true"/>{t("Download CSV template")}</Button><input ref={fileRef} hidden type="file" accept=".csv,text/csv" aria-label={t("Import {label} CSV",{label:t(field.label)})} onChange={event => void read(event.target.files?.[0])}/></div><p>{t("Import replaces the rows in this section. Use the template’s headers and plain numbers without currency symbols.")}</p>{message && <p role="status">{t(message)}</p>}</div>;
}
