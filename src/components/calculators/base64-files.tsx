'use client';
import {Dropdown} from '@/components/ui/dropdown';
import {AccordionItem} from '@/components/ui/accordion';
import {useEffect, useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import {MAX_BINARY_BYTES, MAX_BASE64_CHARACTERS, bytesToBase64, base64ToBytes} from '@/lib/calculators/base64-codec';

export function Base64Files() {
  const [direction, setDirection] = useState('encode'), [whitespace, setWhitespace] = useState(false);
  const [file, setFile] = useState<File | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [output, setOutput] = useState<{url: string; name: string; bytes: number; preview: string} | null>(null);
  const revision = useRef(0), url = useRef<string | null>(null);
  const clear = () => {revision.current++; setBusy(false); setOutput(null); setError(''); if (url.current) URL.revokeObjectURL(url.current); url.current = null;};
  useEffect(() => () => {revision.current++; if (url.current) URL.revokeObjectURL(url.current);}, []);
  async function convert() {
    clear();
    if (!file) {setError('Choose a local file.'); return;}
    const token = revision.current;
    setBusy(true);
    try {
      const limit = direction === 'encode' ? MAX_BINARY_BYTES : MAX_BASE64_CHARACTERS + (whitespace ? MAX_BINARY_BYTES : 0);
      if (file.size > limit) throw Error('The file exceeds the supported 10 MiB binary / equivalent Base64 limit.');
      const bytes = new Uint8Array(await file.arrayBuffer());
      let blob: Blob, preview = '', name: string;
      const base = file.name.replace(/[\\/\u0000-\u001f]/g, '_').slice(0, 150) || 'file';
      if (direction === 'encode') {
        const encoded = bytesToBase64(bytes); preview = encoded.slice(0, 8000);
        blob = new Blob([encoded], {type: 'text/plain;charset=us-ascii'}); name = base + '.base64.txt';
      } else {
        if (bytes.some(byte => byte > 127)) throw Error('The input file must contain ASCII Base64 text.');
        const text = new TextDecoder('utf-8', {fatal: true}).decode(bytes), decoded = base64ToBytes(text, whitespace);
        blob = new Blob([new Uint8Array(decoded).buffer], {type: 'application/octet-stream'});
        name = base.replace(/(?:\.base64)?\.txt$|\.b64$/i, '') + '.decoded.bin';
      }
      if (token !== revision.current) return;
      url.current = URL.createObjectURL(blob);
      setOutput({url: url.current, name, bytes: blob.size, preview});
    } catch (e) {if (token === revision.current) setError(e instanceof Error ? e.message : 'The file could not be converted.');}
    finally {if (token === revision.current) setBusy(false);}
  }
  return <section className="file-codec no-print" aria-labelledby="file-codec-title">
    <h2 id="file-codec-title">Encode or decode a local file</h2>
    <p>Binary files up to 10 MiB. Files stay in this browser, and decoded content is downloaded as bytes.</p>
    <div className="field"><label id="file-direction-label" htmlFor="file-direction">Operation</label><Dropdown id="file-direction" aria-labelledby="file-direction-label" value={direction} onValueChange={value=>{clear();setDirection(value);}} options={[{value:"encode",label:"File → Base64 text"},{value:"decode",label:"Base64 text file → binary file"}]}/></div>
    <div className="field"><label htmlFor="base64-local-file">Choose file</label><input id="base64-local-file" type="file" onChange={e => {clear(); setFile(e.target.files?.[0] || null);}}/></div>
    {direction === 'decode' && <label className="file-codec-checkbox"><input type="checkbox" checked={whitespace} onChange={e => {clear(); setWhitespace(e.target.checked);}}/>Remove ASCII whitespace before decoding</label>}
    <div className="form-actions"><Button type="button" disabled={busy} onClick={convert}>{busy ? 'Converting…' : 'Convert file'}</Button><Button type="button" variant="ghost" onClick={clear}>Clear result</Button></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    {output && <div role="status"><p>{output.bytes.toLocaleString()} output bytes. <a href={output.url} download={output.name}>Download {output.name}</a></p>{direction === 'encode' && <AccordionItem title="Base64 preview (first 8,000 characters)"><pre className="file-codec-preview">{output.preview || '(empty file)'}</pre></AccordionItem>}</div>}
  </section>;
}
