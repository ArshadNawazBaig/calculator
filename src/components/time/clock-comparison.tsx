import Link from 'next/link';
import {offsetLabel, offsetMinutes, supportsZone, timeFormatter} from '@/lib/time/engine';
import {zoneById, zoneHref} from '@/lib/time/catalog';
import {languages, localizedPath, type Locale} from '@/lib/i18n/config';
import copy from '@/data/locales/explanations.json';
import styles from '@/components/content/explanation.module.css';

export function ClockComparison({zoneId, at, locale = 'en'}: {zoneId: string; at: number; locale?: Locale}) {
  const text = copy[locale], tag = languages[locale].tag;
  const ids = [...new Set([zoneId, 'UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'])].filter(supportsZone);
  const year = new Date(at).getUTCFullYear();
  const samples = [0,3,6,9].map(month => Date.UTC(year, month, 15, 12));
  const format = (epoch: number, zone: string) => timeFormatter(tag, zone, {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(epoch);
  return <>
    <section className={styles.panel} data-clock-comparison>
      <h2>{text.clockTitle}</h2><p>{text.clockIntro}</p>
      <p className={styles.snapshot}><time dateTime={new Date(at).toISOString()}>{format(at, 'UTC')} UTC</time></p>
      <div className={styles.scroll} role="region" aria-label={text.clockTitle} tabIndex={0}><table className={styles.table}>
        <thead><tr><th scope="col">{text.place}</th><th scope="col">{text.localTime}</th><th scope="col">{text.offset}</th></tr></thead>
        <tbody>{ids.map(id => {const zone = zoneById.get(id); return <tr key={id}><th scope="row">{zone && id !== zoneId ? <Link href={localizedPath(zoneHref(zone), locale)}>{zone.place}</Link> : zone?.place || id}<br/><small dir="ltr">{id}</small></th><td><time dateTime={new Date(at).toISOString()}>{format(at,id)}</time></td><td dir="ltr">{offsetLabel(offsetMinutes(at,id))}</td></tr>;})}</tbody>
      </table></div>
      <Link className="text-link" href={localizedPath('/time-zone-calculator', locale)}>{text.clockLink}</Link>
    </section>
    <section className={styles.panel}>
      <h2>{text.seasonalTitle}</h2><p>{text.seasonalIntro}</p>
      <div className={styles.scroll} role="region" aria-label={text.seasonalTitle} tabIndex={0}><table className={styles.table}>
        <caption dir="ltr">{zoneId} · {year}</caption>
        <thead><tr><th scope="col">{text.date} (UTC)</th><th scope="col">{text.offset}</th></tr></thead>
        <tbody>{samples.map(epoch => <tr key={epoch}><th scope="row"><time dateTime={new Date(epoch).toISOString()}>{format(epoch,'UTC')}</time></th><td dir="ltr">{offsetLabel(offsetMinutes(epoch,zoneId))}</td></tr>)}</tbody>
      </table></div>
    </section>
  </>;
}
