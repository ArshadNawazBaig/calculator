'use client';
import {useEffect, useRef, useState} from 'react';
import {Flag, Pause, Play, RotateCcw, Volume2} from 'lucide-react';
import {useI18n} from '@/components/i18n/provider';
import {Button} from '@/components/ui/button';
import {useHydrated} from '@/lib/use-hydrated';
import {durationText, timerDuration} from '@/lib/time/engine';
import styles from './time.module.css';

const timerKey = 'finflo-countdown-v1';
type TimerState = {duration: number; remaining: number; deadline: number | null; finished: boolean};
export function TimerTool({stopwatch = false}: {stopwatch?: boolean}) {
  const {t} = useI18n(), hydrated = useHydrated();
  const [hours, setHours] = useState('0'), [minutes, setMinutes] = useState('5'), [seconds, setSeconds] = useState('0');
  const [timer, setTimer] = useState<TimerState>({duration: 300000, remaining: 300000, deadline: null, finished: false});
  const [elapsed, setElapsed] = useState(0), [running, setRunning] = useState(false), [laps, setLaps] = useState<number[]>([]);
  const [error, setError] = useState(''), [sound, setSound] = useState(false);
  const stopwatchAnchor = useRef({at: 0, elapsed: 0}), audio = useRef<AudioContext | null>(null);
  const persist = (next: TimerState) => {try {sessionStorage.setItem(timerKey, JSON.stringify(next));} catch {/* The timer still works without storage. */}};
  const update = (next: TimerState) => {setTimer(next); persist(next);};
  useEffect(() => {
    if (stopwatch) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(timerKey) || 'null');
      if (saved && Number.isFinite(saved.duration) && saved.duration > 0 && saved.duration < 360000000 && Number.isFinite(saved.remaining) && saved.remaining >= 0 && saved.remaining <= saved.duration && (saved.deadline === null || Number.isFinite(saved.deadline))) {
        const remaining = saved.deadline === null ? saved.remaining : Math.max(0, saved.deadline - Date.now());
        // Restore browser session data only after hydration; the server cannot read it.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTimer({...saved, remaining, finished: remaining === 0, deadline: remaining === 0 ? null : saved.deadline});
        setHours(String(Math.floor(saved.duration / 3600000)));
        setMinutes(String(Math.floor(saved.duration / 60000) % 60));
        setSeconds(String(Math.floor(saved.duration / 1000) % 60));
      }
    } catch {/* Ignore damaged saved timers. */}
  }, [stopwatch]);
  useEffect(() => () => {void audio.current?.close();}, []);
  useEffect(() => {
    if (stopwatch || timer.deadline === null) return;
    const deadline = timer.deadline;
    const tick = () => {
      const remaining = Math.max(0, deadline - Date.now());
      setTimer(previous => ({...previous, remaining, finished: remaining === 0, deadline: remaining === 0 ? null : deadline}));
      if (remaining === 0) {
        clearInterval(interval);
        persist({duration: timer.duration, remaining: 0, deadline: null, finished: true});
        if (sound && audio.current?.state === 'running') {
          const context = audio.current;
          for (let beep = 0; beep < 3; beep++) {
            const oscillator = context.createOscillator(), gain = context.createGain(), at = context.currentTime + beep * .35;
            oscillator.frequency.value = 880; gain.gain.setValueAtTime(.12, at); gain.gain.exponentialRampToValueAtTime(.001, at + .2);
            oscillator.connect(gain); gain.connect(context.destination); oscillator.start(at); oscillator.stop(at + .2);
          }
        }
      }
    };
    const interval = window.setInterval(tick, 100);
    const visible = () => {if (document.visibilityState === 'visible') tick();};
    document.addEventListener('visibilitychange', visible);
    return () => {clearInterval(interval); document.removeEventListener('visibilitychange', visible);};
  }, [stopwatch, timer.deadline, timer.duration, sound]);
  useEffect(() => {
    if (!stopwatch || !running) return;
    const interval = window.setInterval(() => setElapsed(stopwatchAnchor.current.elapsed + performance.now() - stopwatchAnchor.current.at), 33);
    return () => clearInterval(interval);
  }, [stopwatch, running]);
  const start = () => {
    setError('');
    if (stopwatch) {stopwatchAnchor.current = {at: performance.now(), elapsed}; setRunning(true); return;}
    const configured = timerDuration(hours, minutes, seconds);
    if (configured === null) {setError(t('Enter a duration from 1 second to 99 hours, 59 minutes, 59 seconds. Minutes and seconds must be between 0 and 59.')); return;}
    const remaining = configured === timer.duration && timer.remaining > 0 ? timer.remaining : configured;
    update({duration: configured, remaining, deadline: Date.now() + remaining, finished: false});
    if (sound) {try {audio.current ||= new AudioContext(); void audio.current.resume().catch(() => {});} catch {/* The visual completion message is always available. */}}
  };
  const pause = () => {
    if (stopwatch) {setElapsed(stopwatchAnchor.current.elapsed + performance.now() - stopwatchAnchor.current.at); setRunning(false);}
    else if (timer.deadline !== null) {const remaining = Math.max(0, timer.deadline - Date.now()); update({...timer, remaining, deadline: null, finished: remaining === 0});}
  };
  const reset = () => {
    setError('');
    if (stopwatch) {setElapsed(0); setRunning(false); setLaps([]);}
    else {const duration = timerDuration(hours, minutes, seconds) || timer.duration; update({duration, remaining: duration, deadline: null, finished: false});}
  };
  const active = stopwatch ? running : timer.deadline !== null;
  const configured = timerDuration(hours, minutes, seconds);
  const displayed = stopwatch ? elapsed : !active && configured !== null && configured !== timer.duration ? configured : timer.remaining;
  return <section className={styles.timerLayout} aria-label={t(stopwatch ? 'Stopwatch controls' : 'Countdown controls')}>
    <div className={styles.clock} data-theme-surface="dark">
      <div className={styles.clockTop}><span className={styles.live}><span/>{t(stopwatch ? 'MAKE EVERY SECOND COUNT' : 'A LITTLE TIME. ALL YOURS.')}</span><span className={styles.state}>{t(active ? 'Running' : !stopwatch && timer.finished ? 'Finished' : 'Ready')}</span></div>
      <div className={`${styles.digital} ${stopwatch ? styles.stopwatchDigits : ''}`} role="timer" aria-live="off" dir="ltr" data-timer-display>{durationText(displayed, stopwatch)}</div>
      {!stopwatch && <div className={styles.progress} aria-hidden="true"><span style={{width: `${Math.max(0, Math.min(100, 100 - timer.remaining / timer.duration * 100))}%`}}/></div>}
      <p className={styles.timerStatus} role="status" data-timer-status>{!stopwatch && timer.finished ? t('Time’s up! Your countdown is complete.') : t(stopwatch ? 'Start, pause, and capture each lap.' : 'Your next moment starts here.')}</p>
      <div className={styles.timerActions}><Button disabled={!hydrated} onClick={active ? pause : start}>{active ? <Pause size={18} aria-hidden="true"/> : <Play size={18} aria-hidden="true"/>}{t(active ? 'Pause' : 'Start')}</Button><Button variant="secondary" disabled={!hydrated} onClick={reset}><RotateCcw size={17} aria-hidden="true"/>{t('Reset')}</Button>{stopwatch && <Button variant="secondary" disabled={!active || laps.length >= 50} onClick={() => setLaps(previous => [...previous, stopwatchAnchor.current.elapsed + performance.now() - stopwatchAnchor.current.at])}><Flag size={17} aria-hidden="true"/>{t('Lap')}</Button>}</div>
      <noscript><p>{t('Enable JavaScript for live clocks and timer controls.')}</p></noscript>
    </div>
    <div className={styles.timerSettings}>
      {stopwatch ? <><h2>{t('Lap times')}</h2><p className={styles.note}>{t('Record up to 50 laps. Reset clears the stopwatch and its laps.')}</p>{laps.length ? <div className={styles.laps}><table><thead><tr><th>{t('Lap')}</th><th>{t('Split')}</th><th>{t('Total')}</th></tr></thead><tbody>{laps.map((lap, index) => <tr key={index}><td>{index + 1}</td><td dir="ltr">{durationText(lap - (laps[index - 1] || 0), true)}</td><td dir="ltr">{durationText(lap, true)}</td></tr>).reverse()}</tbody></table></div> : <p className={styles.empty}>{t('Your lap times will appear here.')}</p>}</> : <>
        <h2>{t('Set your countdown')}</h2><p className={styles.note}>{t('Choose a preset or enter your own duration.')}</p>
        <div className={styles.presets}>{[1, 5, 10, 25].map(value => <button type="button" key={value} disabled={!hydrated || active} onClick={() => {setHours('0'); setMinutes(String(value)); setSeconds('0'); setError(''); update({duration: value * 60000, remaining: value * 60000, deadline: null, finished: false});}}>{t('{minutes} min', {minutes: value})}</button>)}</div>
        <div className={styles.durationFields}>{[{label: 'Hours', value: hours, set: setHours, max: 99}, {label: 'Minutes', value: minutes, set: setMinutes, max: 59}, {label: 'Seconds', value: seconds, set: setSeconds, max: 59}].map(field => <label key={field.label}>{t(field.label)}<input type="number" min="0" max={field.max} step="1" inputMode="numeric" disabled={!hydrated || active} value={field.value} aria-invalid={Boolean(error)} onChange={event => {
          field.set(event.target.value); setError('');
          const duration = timerDuration(field.label === 'Hours' ? event.target.value : hours, field.label === 'Minutes' ? event.target.value : minutes, field.label === 'Seconds' ? event.target.value : seconds);
          if (duration !== null) update({duration, remaining: duration, deadline: null, finished: false});
          else setTimer(previous => ({...previous, finished: false}));
        }}/></label>)}</div>
        <p className={styles.error} role="alert">{error}</p>
        <label className={styles.sound}><input type="checkbox" checked={sound} onChange={event => setSound(event.target.checked)} disabled={active || !hydrated}/><Volume2 size={18} aria-hidden="true"/>{t('Play sound when finished')}</label>
        <p className={styles.note}>{t('Keep this page open for the alert. Sleeping devices and muted tabs can delay or silence it. The remaining time catches up when you return.')}</p>
        <p className={styles.note}>{t('Your countdown is restored after a reload in this tab when browser storage is available.')}</p>
      </>}
    </div>
  </section>;
}
