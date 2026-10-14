'use client';

import {useEffect, useRef, useState} from 'react';
import {Check, Copy, RotateCcw, RotateCw, Shuffle, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useHydrated} from '@/lib/use-hydrated';
import {colorForEntry, type WheelDefinition} from '@/lib/spin-wheels/catalog';
import {landingRotation, MAX_ENTRIES, numberEntries, parseWheelEntries, pickIndex, segmentInk, segmentPath, shuffleEntries} from '@/lib/spin-wheels/engine';
import styles from './wheels.module.css';

const palette = ['#d5f915', '#252b23', '#e1ecb7', '#3d4731', '#adc76d', '#1d211d'];
type Pick = {label: string; index: number; id: number};

export function WheelEditor({wheel}: {wheel: WheelDefinition}) {
  const hydrated = useHydrated();
  const [text, setText] = useState(wheel.entries.join('\n'));
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [duration, setDuration] = useState(4000);
  const [result, setResult] = useState<Pick | null>(null);
  const [history, setHistory] = useState<Pick[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [minimum, setMinimum] = useState('1');
  const [maximum, setMaximum] = useState('10');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinId = useRef(0);
  const busy = useRef(false);
  const parsed = parseWheelEntries(text);
  const entries = parsed.entries.slice(0, MAX_ENTRIES);
  const duplicateCount = entries.length - new Set(entries).size;
  const isNumbers = wheel.slug === 'number-picker-wheel';
  const isColors = wheel.slug === 'random-color-wheel';
  const resultColor = isColors && result ? colorForEntry(result.label) : undefined;

  useEffect(() => () => {if (timer.current) clearTimeout(timer.current);}, []);

  function replaceEntries(next: string) {
    setText(next); setResult(null); setRotation(0); setError(''); setMessage('');
  }
  function loadPreset(next: string[]) {
    replaceEntries(next.join('\n'));
    if (isNumbers) {setMinimum(next[0]); setMaximum(next[next.length - 1]);}
  }
  function reset() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null; busy.current = false;
    setSpinning(false); setHistory([]); loadPreset(wheel.entries);
  }
  function spin() {
    if (busy.current || parsed.error || !hydrated) return;
    try {
      const index = pickIndex(entries.length);
      const selected = {label: entries[index], index, id: ++spinId.current};
      const milliseconds = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 4000;
      busy.current = true; setDuration(milliseconds); setSpinning(true); setResult(null); setError(''); setMessage('');
      setRotation(current => landingRotation(current, index, entries.length));
      timer.current = setTimeout(() => {
        setResult(selected); setHistory(previous => [selected, ...previous].slice(0, 10));
        setSpinning(false); busy.current = false; timer.current = null;
      }, milliseconds);
    } catch {setError('The wheel could not pick a result. Please try again.');}
  }
  function shuffle() {
    try {replaceEntries(shuffleEntries(entries).join('\n'));}
    catch {setError('The entries could not be shuffled. Please try again.');}
  }
  function applyRange() {
    try {replaceEntries(numberEntries(minimum, maximum).join('\n'));}
    catch (error) {setError(error instanceof Error ? error.message : 'Check your number range.');}
  }
  function removeResult() {
    if (!result) return;
    const label = result.label;
    replaceEntries(entries.filter((_, index) => index !== result.index).join('\n'));
    setMessage(`Removed ${label}. ${entries.length - 1} entries remain.`);
  }
  async function copyResult() {
    if (!result) return;
    try {await navigator.clipboard.writeText(result.label + (resultColor ? ` (${resultColor.toUpperCase()})` : '')); setMessage('Result copied.');}
    catch {setMessage('Copy is unavailable in this browser. Select the result text to copy it.');}
  }

  return <section className={styles.workspace} aria-label={`${wheel.title} interactive tool`} id="wheel">
    <div className={styles.editor}>
      <div className={styles.panelHeading}><h2>Make it your wheel</h2><span>{entries.length} entries</span></div>
      <p className={styles.hint}>Start with a preset or add your own list.</p>
      <div className={styles.presets} role="group" aria-label="Wheel presets">
        {wheel.presets.map(preset => <button key={preset.label} type="button" disabled={spinning || !hydrated} aria-pressed={text === preset.entries.join('\n')} onClick={() => loadPreset(preset.entries)}>{preset.label}</button>)}
      </div>
      {isNumbers && <div className={styles.range}>
        <div><label htmlFor="wheel-minimum">First number</label><input id="wheel-minimum" type="number" step="1" min="-1000000" max="1000000" value={minimum} disabled={spinning} onChange={event => setMinimum(event.target.value)}/></div>
        <div><label htmlFor="wheel-maximum">Last number</label><input id="wheel-maximum" type="number" step="1" min="-1000000" max="1000000" value={maximum} disabled={spinning} onChange={event => setMaximum(event.target.value)}/></div>
        <Button variant="secondary" type="button" onClick={applyRange} disabled={spinning || !hydrated}>Apply range</Button>
      </div>}
      <label htmlFor="wheel-entries" className={styles.entryLabel}>{wheel.entryLabel}</label>
      <textarea id="wheel-entries" value={text} disabled={spinning} onChange={event => replaceEntries(event.target.value)} spellCheck={false} maxLength={12000} aria-describedby="wheel-entries-help wheel-entry-error" aria-invalid={Boolean(parsed.error)} rows={8}/>
      <p id="wheel-entries-help" className={styles.hint}>One entry per line. Up to 100 entries, 60 characters each.</p>
      <p id="wheel-entry-error" className={styles.error} role="alert">{parsed.error || error}</p>
      <div className={styles.editorActions}>
        <Button type="button" variant="secondary" onClick={shuffle} disabled={spinning || Boolean(parsed.error) || !hydrated}><Shuffle size={16} aria-hidden="true"/>Shuffle</Button>
        <Button type="button" variant="ghost" onClick={reset} disabled={!hydrated}><RotateCcw size={16} aria-hidden="true"/>Reset wheel</Button>
      </div>
      <div className={styles.entryNote}><Check size={16} aria-hidden="true"/><p>{duplicateCount ? 'Repeated entries have extra chances. Remove duplicates if each choice should have equal odds.' : 'Each entry has an equal chance. Remove the picked entry to avoid selecting it again.'}</p></div>
      <p className={styles.hint}>Your list and results stay in this page. Reloading or leaving clears them.</p>
    </div>

    <div className={styles.stage} data-theme-surface="dark">
      <div className={styles.stageHeading}><span className={styles.eyebrow}>A little chance. A new choice.</span><span className={styles.statusDot}>{spinning ? 'Spinning' : entries.length ? 'Ready to spin' : 'Add your entries'}</span></div>
      <div className={styles.wheelFrame} aria-hidden="true">
        <div className={styles.pointer}/>
        <svg className={styles.wheelGraphic} viewBox="0 0 400 400" focusable="false" style={{transform: `rotate(${rotation}deg)`, transition: spinning ? `transform ${duration}ms cubic-bezier(.12,.72,.12,1)` : 'none'}}>
          <circle cx="200" cy="200" r="196" fill="#101113" stroke="#515f25" strokeWidth="2"/>
          {entries.length === 0 ? <circle cx="200" cy="200" r="188" fill="#252b23"/> : entries.map((entry, index) => {
            const fill = (isColors && colorForEntry(entry)) || palette[index % palette.length];
            const angle = (index + .5) * 360 / entries.length - 90;
            const label = Array.from(entry).length > 17 ? Array.from(entry).slice(0, 15).join('') + '…' : entry;
            return <g key={index}>
              {entries.length === 1 ? <circle cx="200" cy="200" r="188" fill={fill}/> : <path d={segmentPath(index, entries.length)} fill={fill} stroke="#101113" strokeWidth="1.5"/>}
              {entries.length <= 40 && <text transform={`translate(200 200) rotate(${angle})`} x="174" y="0" dy=".35em" textAnchor="end" fill={segmentInk(fill)} fontSize={entries.length > 20 ? 8 : entries.length > 12 ? 10 : 12} fontWeight="600">{label}</text>}
            </g>;
          })}
        </svg>
        <div className={styles.hub}><RotateCw size={26}/><span>FINFLO</span></div>
      </div>
      {entries.length > 40 && <p className={styles.denseNote}>Labels are hidden on larger wheels. Your full list and picked result stay visible.</p>}
      <Button className={styles.spinButton} onClick={spin} disabled={spinning || Boolean(parsed.error) || !hydrated}><RotateCw size={19} aria-hidden="true"/>{spinning ? 'Spinning…' : 'Spin the wheel'}</Button>
      <noscript><p>Enable JavaScript to edit entries and spin the wheel.</p></noscript>
      <div className={styles.result} role="status" aria-live="polite" aria-atomic="true">
        <span>{spinning ? 'Choosing your next result…' : result ? 'Your result' : 'Your next pick starts here'}</span>
        {result ? <><strong data-wheel-result data-result-index={result.index}>{resultColor && <i className={styles.swatch} style={{backgroundColor: resultColor}} aria-hidden="true"/>}{result.label}</strong>{resultColor && <small>{resultColor.toUpperCase()}</small>}</> : <p>{spinning ? 'The wheel is turning.' : 'Review your entries, then give it a spin.'}</p>}
      </div>
      {result && <div className={styles.resultActions}><Button type="button" variant="secondary" onClick={copyResult}><Copy size={15} aria-hidden="true"/>Copy result</Button><Button type="button" variant="secondary" onClick={removeResult}><Trash2 size={15} aria-hidden="true"/>Remove picked entry</Button></div>}
      <p className={styles.feedback} role="status">{message}</p>
    </div>
    <div className={styles.history}>
      <div className={styles.panelHeading}><h2>Recent spins</h2>{history.length > 0 && <button type="button" onClick={() => setHistory([])} disabled={spinning}>Clear history</button>}</div>
      {history.length ? <ol>{history.map((pick, index) => <li key={pick.id}><span>{index === 0 ? 'Latest' : `#${pick.id}`}</span><strong>{pick.label}</strong></li>)}</ol> : <p>Your last 10 picks will appear here during this visit.</p>}
    </div>
  </section>;
}
