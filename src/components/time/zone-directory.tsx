'use client';
import {useMemo, useState} from 'react';
import {ArrowUpRight, Search} from 'lucide-react';
import Link from '@/components/i18n/link';
import {useI18n} from '@/components/i18n/provider';
import {Button} from '@/components/ui/button';
import {Dropdown} from '@/components/ui/dropdown';
import {useHydrated} from '@/lib/use-hydrated';
import {zones, zoneHref, popularZoneIds} from '@/lib/time/catalog';
import styles from './time.module.css';
const normalize = (text: string) => text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[_/]/g, ' ');
export function ZoneDirectory({countries, compact = false}: {countries: Record<string, string>; compact?: boolean}) {
  const {t} = useI18n();
  const hydrated = useHydrated();
  const [query, setQuery] = useState(''), [region, setRegion] = useState('all'), [limit, setLimit] = useState(24);
  const regions = ['Africa', 'America', 'Antarctica', 'Asia', 'Atlantic', 'Australia', 'Europe', 'Indian', 'Pacific', 'Etc', 'UTC'];
  const results = useMemo(() => {
    const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
    return zones.filter(zone => (region === 'all' || zone.region === region) && terms.every(term => normalize(`${zone.id} ${zone.place} ${zone.aliases.join(' ')} ${zone.country} ${countries[zone.country] || ''}`).includes(term)));
  }, [query, region, countries]);
  const visible = compact && !query ? popularZoneIds.map(id => zones.find(zone => zone.id === id)!).filter(Boolean) : results.slice(0, limit);
  return <section className={styles.section} aria-labelledby="zone-directory-title">
    <div className={styles.heading}><div><span className="eyebrow">{t('ONE WORLD. EVERY TIME ZONE.')}</span><h2 id="zone-directory-title">{t(compact ? 'What time is it there?' : 'Find a time zone')}</h2><p>{t('Search by city, country, or time-zone name. Open a clock to see its local time and date.')}</p></div>{compact && <Link href="/time/time-zones" className="text-link">{t('All time zones')}<ArrowUpRight size={16} aria-hidden="true"/></Link>}</div>
    <div className={styles.directoryControls}><div className={styles.search}><label htmlFor="zone-search">{t('Search time zones')}</label><div><Search size={19} aria-hidden="true"/><input id="zone-search" type="search" disabled={!hydrated} value={query} onChange={event => {setQuery(event.target.value); setLimit(24);}} placeholder={t('Try London, Pakistan, or Asia/Tokyo')} autoComplete="off"/></div></div>
      {!compact && <div className={styles.region}><label id="zone-region-label" htmlFor="zone-region">{t('Region')}</label><Dropdown id="zone-region" aria-labelledby="zone-region-label" disabled={!hydrated} value={region} onValueChange={value => {setRegion(value); setLimit(24);}} options={[{value: 'all', label: t('All regions')}, ...regions.map(value => ({value, label: t(value === 'Etc' ? 'Fixed UTC offsets' : value)}))]}/></div>}
    </div>
    <p className={styles.note} role="status">{t(compact && !query ? 'Popular clocks around the world' : '{count} time zones found', {count: results.length})}</p>
    <div className={styles.zoneGrid}>{visible.map(zone => <Link href={zoneHref(zone)} key={zone.id} className={styles.zoneCard}>
      <span><strong>{zone.place}</strong><small>{countries[zone.country] || t(zone.region === 'Etc' ? 'Fixed UTC offsets' : zone.region)}</small><code dir="ltr">{zone.id}</code></span><ArrowUpRight size={17} aria-hidden="true"/>
    </Link>)}</div>
    {results.length === 0 && <p className={styles.empty}>{t('No time zones found. Try a city name or a shorter search.')}</p>}
    {(!compact || query) && results.length > limit && <Button variant="secondary" disabled={!hydrated} className={styles.loadMore} onClick={() => setLimit(value => value + 48)}>{t('Show more time zones')}</Button>}
  </section>;
}
