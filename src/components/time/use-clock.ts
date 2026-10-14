'use client';
import {useEffect, useState} from 'react';
export function useClock() {
  const [state, setState] = useState<{now: number | null; source: 'connecting' | 'server' | 'device'; uncertainty: number | null}>({now: null, source: 'connecting', uncertainty: null});
  useEffect(() => {
    let active = true, syncing = false;
    let anchor = {epoch: Date.now(), monotonic: performance.now()};
    let source: 'connecting' | 'server' | 'device' = 'connecting', uncertainty: number | null = null;
    const controller = new AbortController();
    const tick = () => {if (active) setState({now: anchor.epoch + performance.now() - anchor.monotonic, source, uncertainty});};
    const sync = async () => {
      if (syncing) return;
      syncing = true;
      let best: {epoch: number; monotonic: number; latency: number} | null = null;
      for (let sample = 0; sample < 3 && active; sample++) {
        try {
          const start = performance.now();
          const response = await fetch('/api/time', {cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(4000)])});
          if (!response.ok) throw new Error();
          const data = await response.json();
          const end = performance.now(), latency = end - start;
          if (typeof data.timestamp !== 'number' || !Number.isFinite(data.timestamp)) throw new Error();
          if (!best || latency < best.latency) best = {epoch: data.timestamp + latency / 2, monotonic: end, latency};
        } catch {break;}
      }
      if (best) {anchor = best; source = 'server'; uncertainty = Math.ceil(best.latency / 2);}
      else {anchor = {epoch: Date.now(), monotonic: performance.now()}; source = 'device'; uncertainty = null;}
      syncing = false;
      tick();
    };
    const visible = () => {if (document.visibilityState === 'visible') {anchor = {epoch: Date.now(), monotonic: performance.now()}; source = 'connecting'; tick(); void sync();}};
    tick(); void sync();
    const ticker = window.setInterval(tick, 250), resync = window.setInterval(sync, 300000);
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('online', sync);
    return () => {active = false; controller.abort(); clearInterval(ticker); clearInterval(resync); document.removeEventListener('visibilitychange', visible); window.removeEventListener('online', sync);};
  }, []);
  return state;
}
