'use client';
import {useEffect, useRef, useState} from 'react';
import {useI18n} from '@/components/i18n/provider';
import {Button} from '@/components/ui/button';
import {mapRequest} from '@/lib/calculators/road-route';
import type {RoadPlace} from '@/lib/data/road-routing';
import type {Values} from '@/lib/calculators/types';
import styles from './road-locations.module.css';

function LocationSearch({index, values, onChange, disabled}: {index: number; values: Values; onChange: (patch: Values) => void; disabled: boolean}) {
  const {t} = useI18n();
  const query = values[`placeQuery${index}`] || '';
  const selected = values[`placeLabel${index}`] || '';
  const [results, setResults] = useState<{query: string; places: RoadPlace[]} | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const requestId = useRef(0);
  useEffect(() => () => { requestId.current++; }, []);
  async function search() {
    const id = ++requestId.current;
    setBusy(true); setError(''); setResults(null);
    try {
      const data = await mapRequest<{places: RoadPlace[]}>({kind: 'search', query});
      if (id === requestId.current) setResults({query, places: data.places});
    } catch (error) {
      if (id === requestId.current) setError(error instanceof Error ? error.message : 'Place search failed.');
    } finally { if (id === requestId.current) setBusy(false); }
  }
  return <div className={styles.location}>
    <label htmlFor={`road-place-${index}`}>{t(index === 1 ? 'Origin' : 'Destination')}</label>
    <div className={styles.search}>
      <input id={`road-place-${index}`} type="search" value={query} maxLength={200} disabled={disabled} placeholder={t('City, address or landmark')} onChange={event => {
        requestId.current++; setBusy(false); setError(''); setResults(null);
        onChange({[`placeQuery${index}`]: event.target.value, [`placelat${index}`]: '', [`placelon${index}`]: '', [`placeLabel${index}`]: ''});
      }} onKeyDown={event => {if (event.key === 'Enter') {event.preventDefault(); if (!busy && query.trim().length >= 3) void search();}}}/>
      <Button type="button" variant="secondary" disabled={disabled || busy || query.trim().length < 3} onClick={search}>{t(busy ? 'Searching…' : 'Find place')}</Button>
    </div>
    {selected && <p className="field-help">{t('Selected location')}: {selected}</p>}
    {error && <p role="alert" className="form-error">{t(error)}</p>}
    {results?.query === query && !selected && <div aria-live="polite">
      {results.places.length ? <><p className="field-help">{t('Choose the matching location')}</p><ul className={styles.matches}>{results.places.map((place, i) => <li key={i}><Button type="button" variant="secondary" disabled={disabled} onClick={() => onChange({[`placelat${index}`]: String(place.lat), [`placelon${index}`]: String(place.lon), [`placeLabel${index}`]: place.label})}>{place.label}</Button></li>)}</ul></> : <p className="field-help">{t('No places found. Add a city or country, or use coordinates.')}</p>}
    </div>}
  </div>;
}

export function RoadLocations({values, onChange, disabled}: {values: Values; onChange: (patch: Values) => void; disabled: boolean}) {
  return <div className={styles.locations}>{[1, 2].map(index => <LocationSearch key={index} index={index} values={values} onChange={onChange} disabled={disabled}/>)}</div>;
}

export function RoadAttribution() {
  const {t} = useI18n();
  return <div className={styles.disclosure}><p>{t('Place searches and route coordinates are sent through Finflo to map providers. Search only for locations you want to share.')}</p><p>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">{t('OpenStreetMap contributors')}</a> · <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noreferrer">FOSSGIS / OSRM</a> · <a href="https://nominatim.org/" target="_blank" rel="noreferrer">Nominatim</a> · <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">{t('Fix the map')}</a></p></div>;
}
