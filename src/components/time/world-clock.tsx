'use client';
import {useEffect, useMemo, useState, type ReactNode} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowUpRight, Globe2, MapPin, Star, X} from 'lucide-react';
import Link from '@/components/i18n/link';
import {useI18n} from '@/components/i18n/provider';
import {Button} from '@/components/ui/button';
import {Dropdown} from '@/components/ui/dropdown';
import {useHydrated} from '@/lib/use-hydrated';
import {calendarFacts, nextClockChange, offsetLabel, offsetMinutes, supportsZone, timeFormatter} from '@/lib/time/engine';
import {zones, zoneById, zoneHref, type ClockZone} from '@/lib/time/catalog';
import {defaultClockIds, type ClockSnapshot} from '@/lib/time/snapshot';
import {useClock} from './use-clock';
import styles from './time.module.css';

const savedKey = 'finflo-world-clocks-v1', defaultKey = 'finflo-default-clock-v1';
export function WorldClock({initialZone, initialSnapshot, countries, breadcrumbs, introduction, navigation}: {initialZone?: ClockZone; initialSnapshot: ClockSnapshot; countries: Record<string, string>; breadcrumbs: ReactNode; introduction: ReactNode; navigation: ReactNode}) {
  const {t, locale, href} = useI18n(), hydrated = useHydrated();
  const zoneOptions = useMemo(() => zones.map(zone => ({value: zone.id, label: [countries[zone.country], zone.place, zone.place === zone.id ? '' : zone.id].filter(Boolean).join(' · ')})), [countries]);
  const router = useRouter();
  const clock = useClock();
  const [zone, setZone] = useState(initialZone || zoneById.get('UTC')!);
  const [localZone, setLocalZone] = useState('UTC');
  const [hour12, setHour12] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(defaultClockIds);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Client-only preferences must be restored after the identical server/client first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalZone(local);
    setZone(initialZone || zoneById.get(local) || zoneById.get('UTC')!);
    try {
      const stored = JSON.parse(localStorage.getItem(savedKey) || 'null');
      if (Array.isArray(stored)) setFavorites([...new Set(stored.filter((id): id is string => typeof id === 'string' && zoneById.has(id)))].slice(0, 6));
      const preferred = localStorage.getItem(defaultKey);
      if (!initialZone && preferred && zoneById.has(preferred)) setZone(zoneById.get(preferred)!);
    } catch {/* A blocked or damaged preference must not prevent clock use. */}
  }, [initialZone]);
  const supported = clock.now !== null && supportsZone(zone.id);
  const now = supported ? clock.now : null;
  const snapshot = clock.now === null && initialSnapshot?.zoneId === zone.id ? initialSnapshot : null;
  const minute = now === null ? null : Math.floor(now / 60000);
  const change = useMemo(() => minute === null ? null : nextClockChange(minute * 60000, zone.id), [minute, zone.id]);
  const nextChange = snapshot ? snapshot.nextChange : change && now !== null && change.at > now ? change : null;
  const time = (epoch: number, id: string, seconds = true) => timeFormatter(locale, id, {hour: '2-digit', minute: '2-digit', ...(seconds ? {second: '2-digit'} : {}), hourCycle: hour12 ? 'h12' : 'h23'}).format(epoch);
  const date = (epoch: number, id: string) => timeFormatter(locale, id, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}).format(epoch);
  const facts = now === null ? snapshot?.facts : calendarFacts(now, zone.id);
  const offset = now === null ? snapshot?.offset ?? null : offsetMinutes(now, zone.id);
  const difference = now === null ? 0 : offsetMinutes(now, zone.id) - offsetMinutes(now, localZone);
  const duration = new Intl.NumberFormat(locale, {maximumFractionDigits: 2}).format(Math.abs(difference) / 60);
  const saveFavorites = (ids: string[]) => {
    setFavorites(ids);
    try {localStorage.setItem(savedKey, JSON.stringify(ids)); setFeedback('');}
    catch {setFeedback(t('Your clocks work for this visit. Browser storage is unavailable.'));}
  };
  const favorite = () => {
    if (favorites.includes(zone.id)) saveFavorites(favorites.filter(id => id !== zone.id));
    else if (favorites.length < 6) saveFavorites([...favorites, zone.id]);
    else setFeedback(t('You can save up to 6 clocks. Remove one to add another.'));
  };
  const selectZone = (id: string) => {
    const nextZone = zoneById.get(id);
    if (!nextZone) return;
    setZone(nextZone);
    setFeedback('');
    if (initialZone && nextZone.id !== initialZone.id) router.push(href(zoneHref(nextZone)), {scroll: false});
  };
  return <>
    <section className={styles.clockHero} data-theme-surface="dark" aria-labelledby="page-title" data-clock-snapshot-at={initialSnapshot?.at}>
      <div className={`container ${styles.clockHeroInner}`}>
      <div className={styles.clockBreadcrumbs}>{breadcrumbs}</div>
      <div className={styles.clockTop}><span className={styles.live}><span/>{t('LIVE · TIME NOW')}</span><div className={styles.segmented} role="group" aria-label={t('Time format')}>
        {[false, true].map(value => <button key={String(value)} type="button" disabled={!hydrated} aria-pressed={hour12 === value} onClick={() => setHour12(value)}>{t(value ? '12 hour' : '24 hour')}</button>)}
      </div></div>
      {introduction}
      <div className={styles.zonePicker}>
        <label id="clock-zone-label" htmlFor="clock-zone"><MapPin size={16} aria-hidden="true"/>{t('Time zone')}</label>
        <Dropdown id="clock-zone" aria-labelledby="clock-zone-label" value={zone.id} onValueChange={selectZone} options={zoneOptions} searchable disabled={!hydrated} surface="dark"/>
      </div>
      <div className={styles.digital} role="timer" aria-live="off" data-live-clock dir="ltr">{now === null ? snapshot?.time || '—:—:—' : time(now, zone.id)}</div>
      <p className={styles.fullDate} data-clock-date>{now === null ? snapshot?.date || t('Loading your local date…') : date(now, zone.id)}</p>
      <div className={styles.clockMeta}><span dir="ltr">{offset === null ? 'UTC —' : offsetLabel(offset)}</span><span>{now === null ? t('Finding your time zone…') : difference === 0 ? t('Same time as you') : t(difference > 0 ? '{hours} hours ahead of your time' : '{hours} hours behind your time', {hours: duration})}</span></div>
      <div className={styles.clockActions}>
        <Button variant="secondary" disabled={!hydrated} onClick={() => selectZone(zoneById.get(localZone)?.id || 'UTC')}><Globe2 size={16} aria-hidden="true"/>{t('Use my time zone')}</Button>
        <Button variant="secondary" disabled={!hydrated} aria-pressed={favorites.includes(zone.id)} onClick={favorite}><Star size={16} aria-hidden="true" fill={favorites.includes(zone.id) ? 'currentColor' : 'none'}/>{t(favorites.includes(zone.id) ? 'Saved clock' : 'Save clock')}</Button>
        <button className={styles.textButton} type="button" disabled={!hydrated} onClick={() => {try {localStorage.setItem(defaultKey, zone.id); setFeedback(t('Default clock saved.'));} catch {setFeedback(t('Your clocks work for this visit. Browser storage is unavailable.'));}}}>{t('Make default')}</button>
      </div>
      <p className={styles.sync} data-clock-source>{t(snapshot ? 'Server time at page load' : clock.source === 'server' ? 'Synchronized with Finflo’s server' : clock.source === 'device' ? 'Using your device clock · server unavailable' : 'Connecting to the time server…')}{clock.source === 'server' && <> · {t('Network uncertainty about ±{ms} ms', {ms: clock.uncertainty || 0})}</>}</p>
      {clock.now !== null && !supported && <p role="alert">{t('This browser does not recognize this time zone. Update your browser to view its clock.')}</p>}
      <p className={styles.feedback} role="status">{feedback}</p>
      <noscript><p>{t('Enable JavaScript for live clocks and timer controls.')}</p></noscript>
      {navigation}
      </div>
    </section>
    <div className="container">
    <section className={styles.section} aria-labelledby="saved-clocks-title">
      <div className={styles.heading}><div><span className="eyebrow">{t('YOUR WORLD, AT A GLANCE')}</span><h2 id="saved-clocks-title">{t('Your world clocks')}</h2></div><Link href="/time/time-zones" className="text-link">{t('Add a city')}<ArrowUpRight size={16} aria-hidden="true"/></Link></div>
      {favorites.length === 0 && <p className={styles.muted}>{t('Open a city clock and select Save clock to build your own collection.')}</p>}
      <div className={styles.savedGrid}>{favorites.map(id => {const item = zoneById.get(id)!; return <article key={id} className={styles.savedCard}>
        <Link href={zoneHref(item)}><span>{item.place}</span><strong dir="ltr">{clock.now !== null && supportsZone(id) ? time(clock.now, id, false) : snapshot?.favorites[id]?.time || '—:—'}</strong><small>{clock.now !== null && supportsZone(id) ? timeFormatter(locale, id, {weekday: 'short', month: 'short', day: 'numeric'}).format(clock.now) : snapshot?.favorites[id]?.date || item.id}</small></Link>
        <button type="button" disabled={!hydrated} aria-label={t('Remove {place} clock', {place: item.place})} onClick={() => saveFavorites(favorites.filter(value => value !== id))}><X size={15} aria-hidden="true"/></button>
      </article>;})}</div>
    </section>
    <section className={styles.section} aria-labelledby="time-details-title">
      <div className={styles.heading}><div><span className="eyebrow">{t('THE DETAILS BEHIND THE CLOCK')}</span><h2 id="time-details-title">{t('Today in {place}', {place: zone.place})}</h2></div></div>
      <div className={styles.detailsGrid}>
        <div className={styles.detail}><span>{t('Time zone')}</span><strong dir="ltr">{zone.id}</strong><p>{now === null ? snapshot?.zoneName || '—' : timeFormatter(locale, zone.id, {timeZoneName: 'long'}).formatToParts(now).find(part => part.type === 'timeZoneName')?.value}</p></div>
        <div className={styles.detail}><span>{t('Current UTC offset')}</span><strong dir="ltr">{offset === null ? '—' : offsetLabel(offset)}</strong><p>{t('Includes the current daylight-saving adjustment, where applicable.')}</p></div>
        <div className={styles.detail}><span>{t('Next clock change')}</span><strong>{nextChange ? snapshot?.changeDate || timeFormatter(locale, zone.id, {month: 'short', day: 'numeric', year: 'numeric'}).format(nextChange.at) : now === null && !snapshot ? '—' : t('No change scheduled')}</strong><p>{nextChange ? `${offsetLabel(nextChange.before)} → ${offsetLabel(nextChange.after)}` : now === null && !snapshot ? '—' : t('No offset change found in the next 370 days under the available time-zone rules.')}</p></div>
        <div className={styles.detail}><span>{t('Calendar')}</span><strong>{facts ? t('Week {week} · Day {day}', {week: facts.week, day: facts.dayOfYear}) : '—'}</strong><p>{facts ? t('{days} days left in {year}', {days: facts.daysRemaining, year: facts.year}) : '—'}</p></div>
      </div>
      <p className={styles.note}>{t('Initial clock details use server time-zone data; live updates use your browser’s data. Keep your browser updated for new local rules. Week numbers follow ISO 8601.')}</p>
    </section>
    </div>
  </>;
}
