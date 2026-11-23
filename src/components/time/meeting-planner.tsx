'use client';
import {useState, type FormEvent} from 'react';
import {DatePicker} from '@/components/ui/date-picker';
import {Dropdown} from '@/components/ui/dropdown';
import {Button} from '@/components/ui/button';
import {useHydrated} from '@/lib/use-hydrated';
import {useI18n} from '@/components/i18n/provider';
import {languages} from '@/lib/i18n/config';
import {zones} from '@/lib/time/catalog';
import {compareMeeting, type MeetingComparison} from '@/lib/time/meeting';
import panel from '@/components/content/explanation.module.css';
import styles from './time.module.css';

export function MeetingPlanner({source,date:initialDate,initial}: {source:string;date:string;initial:MeetingComparison}) {
  const {locale,t} = useI18n();
  const hydrated = useHydrated();
  const [date,setDate] = useState(initialDate), [time,setTime] = useState('12:00');
  const [destination,setDestination] = useState(initial.destination);
  const [occurrence,setOccurrence] = useState(''), [repeated,setRepeated] = useState(false);
  const [comparison,setComparison] = useState(initial), [error,setError] = useState(''), [status,setStatus] = useState('');
  const reset = () => {setOccurrence('');setRepeated(false);setError('');setStatus('');};
  const submit = (event:FormEvent) => {
    event.preventDefault();
    try {
      const result = compareMeeting(date,time,source,destination,occurrence === 'earlier' || occurrence === 'later' ? occurrence : undefined,languages[locale].tag);
      if (result.repeated) {setRepeated(true);setError('This local time occurs twice when clocks move back. Choose an occurrence and compare again.');return;}
      setComparison(result);setError('');setStatus('Comparison updated. Both rows refer to the same instant.');
    } catch (error) {setError(error instanceof Error ? error.message : 'Check the selected date, time and time zones.');setStatus('');}
  };
  const difference = Math.abs(comparison.minuteDifference), hours = Math.floor(difference / 60), minutes = difference % 60;
  const number = (value:number) => new Intl.NumberFormat(languages[locale].tag).format(value);
  const duration = [hours ? t(hours === 1 ? '{count} hour' : '{count} hours',{count:number(hours)}) : '',minutes ? t(minutes === 1 ? '{count} minute' : '{count} minutes',{count:number(minutes)}) : ''].filter(Boolean).join(' ');
  const day = comparison.dayDifference;
  const dayText = day === 0 ? t('on the same calendar date') : Math.abs(day) === 1
    ? t(day < 0 ? 'one calendar day earlier' : 'one calendar day later')
    : t(day < 0 ? '{count} calendar days earlier' : '{count} calendar days later',{count:number(Math.abs(day))});
  return <section className={panel.panel} data-meeting-planner aria-labelledby="meeting-title">
    <h2 id="meeting-title">{t('Plan a time from this location')}</h2>
    <p>{t('Enter a date and clock time in {zone}, then compare another location. The date belongs to the source zone, regardless of your device’s time zone.',{zone:source})}</p>
    <form onSubmit={submit} className={styles.meetingForm}>
      <div className={styles.meetingFields}>
        <DatePicker id="meeting-date" label={t('Source date')} value={date} onValueChange={value=>{setDate(value);reset();}} min="2026-01-01" max="2035-12-31" required disabled={!hydrated}/>
        <label className={styles.meetingField} htmlFor="meeting-time">{t('Source clock time')}<input id="meeting-time" type="time" value={time} onChange={event=>{setTime(event.target.value);reset();}} required disabled={!hydrated}/></label>
      </div>
      <div className={styles.meetingField}><label id="meeting-destination-label" htmlFor="meeting-destination">{t('Compare with')}</label><Dropdown id="meeting-destination" aria-labelledby="meeting-destination-label" value={destination} onValueChange={value=>{setDestination(value);setError('');setStatus('');}} options={zones.map(zone=>({value:zone.id,label:`${zone.place} · ${zone.id}`}))} searchable disabled={!hydrated}/></div>
      {repeated&&<div className={styles.meetingField}><label id="meeting-occurrence-label" htmlFor="meeting-occurrence">{t('Repeated source time')}</label><Dropdown id="meeting-occurrence" aria-labelledby="meeting-occurrence-label" value={occurrence} onValueChange={setOccurrence} options={[{value:'earlier',label:t('Earlier occurrence')},{value:'later',label:t('Later occurrence')}]} placeholder={t('Choose an occurrence')} required searchable={false}/></div>}
      <Button type="submit" disabled={!hydrated}>{t('Compare times')}</Button>
      <p className={styles.error} role="alert">{t(error)}</p>
      <p className={styles.note}>{t('Select Compare times to apply changes. Missing spring-forward times are rejected; repeated fall-back times require a choice. Planning is available for 2026–2035.')}</p>
      <noscript><p>{t('Enable JavaScript to change this comparison. The example below uses noon in the source zone.')}</p></noscript>
    </form>
    <p className={styles.note} role="status">{t(status)}</p>
    <div className={panel.scroll} role="region" aria-label={t('Meeting comparison')} tabIndex={0}><table className={panel.table} data-meeting-result>
      <caption>{t('Same instant:')} <time dateTime={new Date(comparison.epoch).toISOString()}>{new Date(comparison.epoch).toISOString().replace('T',' ').replace('.000Z',' UTC')}</time>{comparison.occurrence ? ` · ${t(comparison.occurrence === 'earlier' ? 'Earlier occurrence' : 'Later occurrence')}` : ''}</caption>
      <thead><tr><th scope="col">{t('Location')}</th><th scope="col">{t('Local date and time')}</th><th scope="col">{t('UTC offset')}</th></tr></thead>
      <tbody>{[[comparison.source,comparison.sourceOffset,comparison.sourceTime],[comparison.destination,comparison.destinationOffset,comparison.destinationTime]].map(([zone,offset,localTime],index)=><tr key={index}><th scope="row"><small>{t(index===0?'Source':'Destination')}</small><br/><span dir="ltr">{zone}</span></th><td><time dateTime={new Date(comparison.epoch).toISOString()}>{localTime}</time></td><td dir="ltr">{offset}</td></tr>)}</tbody>
    </table></div>
    <p data-meeting-summary>{comparison.minuteDifference === 0 ? t('Both locations have the same local time and calendar date.') : t(comparison.minuteDifference > 0 ? 'The destination is {duration} ahead of the source, {day}.' : 'The destination is {duration} behind the source, {day}.',{duration,day:dayText})}{' '}{t('Offsets apply to this date; a different date may change the difference.')}</p>
    {comparison.nextWeek && <div data-weekly-meeting>
      <h3>{t('Same source time one week later')}</h3>
      {comparison.nextWeek.times.length === 0 && <p>{t('On {date}, the source clock skips this time in {zone}. Choose another time for that week.',{date:comparison.nextWeek.date,zone:source})}</p>}
      {comparison.nextWeek.times.length === 2 && <p>{t('On {date}, this time occurs twice in {zone}. The two destination times are shown in order.',{date:comparison.nextWeek.date,zone:source})}</p>}
      {comparison.nextWeek.times.map(next => <p key={next.epoch}>
        <bdi>{comparison.destination}</bdi>{' · '}<time dateTime={new Date(next.epoch).toISOString()}>{next.destinationTime}</time>{' · '}<bdi>{next.offset}</bdi>
      </p>)}
    </div>}
  </section>;
}
