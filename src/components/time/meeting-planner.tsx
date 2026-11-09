'use client';
import {useState, type FormEvent} from 'react';
import {DatePicker} from '@/components/ui/date-picker';
import {Dropdown} from '@/components/ui/dropdown';
import {Button} from '@/components/ui/button';
import {useHydrated} from '@/lib/use-hydrated';
import {zones} from '@/lib/time/catalog';
import {compareMeeting, type MeetingComparison} from '@/lib/time/meeting';
import panel from '@/components/content/explanation.module.css';
import styles from './time.module.css';

export function MeetingPlanner({source,date:initialDate,initial}: {source:string;date:string;initial:MeetingComparison}) {
  const hydrated = useHydrated();
  const [date,setDate] = useState(initialDate), [time,setTime] = useState('12:00');
  const [destination,setDestination] = useState(initial.destination);
  const [occurrence,setOccurrence] = useState(''), [repeated,setRepeated] = useState(false);
  const [comparison,setComparison] = useState(initial), [error,setError] = useState(''), [status,setStatus] = useState('');
  const reset = () => {setOccurrence('');setRepeated(false);setError('');setStatus('');};
  const submit = (event:FormEvent) => {
    event.preventDefault();
    try {
      const result = compareMeeting(date,time,source,destination,occurrence === 'earlier' || occurrence === 'later' ? occurrence : undefined);
      if (result.repeated) {setRepeated(true);setError('This local time occurs twice when clocks move back. Choose an occurrence and compare again.');return;}
      setComparison(result);setError('');setStatus('Comparison updated. Both rows refer to the same instant.');
    } catch (error) {setError(error instanceof Error ? error.message : 'Check the selected date, time and time zones.');setStatus('');}
  };
  const difference = Math.abs(comparison.minuteDifference), hours = Math.floor(difference / 60), minutes = difference % 60;
  const duration = [hours ? `${hours} ${hours === 1 ? 'hour' : 'hours'}` : '',minutes ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` : ''].filter(Boolean).join(' ');
  const day = comparison.dayDifference;
  const dayText = day === 0 ? 'the same calendar date' : `${Math.abs(day) === 1 ? 'one calendar day' : `${Math.abs(day)} calendar days`} ${day < 0 ? 'earlier' : 'later'}`;
  return <section className={panel.panel} data-meeting-planner aria-labelledby="meeting-title">
    <h2 id="meeting-title">Plan a time from this location</h2>
    <p>Enter a date and clock time in <strong dir="ltr">{source}</strong>, then compare another location. The date belongs to the source zone, regardless of your device’s time zone.</p>
    <form onSubmit={submit} className={styles.meetingForm}>
      <div className={styles.meetingFields}>
        <DatePicker id="meeting-date" label="Source date" value={date} onValueChange={value=>{setDate(value);reset();}} min="2026-01-01" max="2035-12-31" required disabled={!hydrated}/>
        <label className={styles.meetingField} htmlFor="meeting-time">Source clock time<input id="meeting-time" type="time" value={time} onChange={event=>{setTime(event.target.value);reset();}} required disabled={!hydrated}/></label>
      </div>
      <div className={styles.meetingField}><label id="meeting-destination-label" htmlFor="meeting-destination">Compare with</label><Dropdown id="meeting-destination" aria-labelledby="meeting-destination-label" value={destination} onValueChange={value=>{setDestination(value);setError('');setStatus('');}} options={zones.map(zone=>({value:zone.id,label:`${zone.place} · ${zone.id}`}))} searchable disabled={!hydrated}/></div>
      {repeated&&<div className={styles.meetingField}><label id="meeting-occurrence-label" htmlFor="meeting-occurrence">Repeated source time</label><Dropdown id="meeting-occurrence" aria-labelledby="meeting-occurrence-label" value={occurrence} onValueChange={setOccurrence} options={[{value:'earlier',label:'Earlier occurrence'},{value:'later',label:'Later occurrence'}]} placeholder="Choose an occurrence" required searchable={false}/></div>}
      <Button type="submit" disabled={!hydrated}>Compare times</Button>
      <p className={styles.error} role="alert">{error}</p>
      <p className={styles.note}>Select Compare times to apply changes. Missing spring-forward times are rejected; repeated fall-back times require a choice. Planning is available for 2026–2035.</p>
      <noscript><p>Enable JavaScript to change this comparison. The example below uses noon in the source zone.</p></noscript>
    </form>
    <p className={styles.note} role="status">{status}</p>
    <div className={panel.scroll} role="region" aria-label="Meeting comparison" tabIndex={0}><table className={panel.table} data-meeting-result>
      <caption>Same instant: <time dateTime={new Date(comparison.epoch).toISOString()}>{new Date(comparison.epoch).toISOString().replace('T',' ').replace('.000Z',' UTC')}</time>{comparison.occurrence ? ` · ${comparison.occurrence} occurrence` : ''}</caption>
      <thead><tr><th scope="col">Location</th><th scope="col">Local date and time</th><th scope="col">UTC offset</th></tr></thead>
      <tbody>{[[comparison.source,comparison.sourceTime,comparison.sourceOffset],[comparison.destination,comparison.destinationTime,comparison.destinationOffset]].map(([zone,local,offset],index)=><tr key={index}><th scope="row"><small>{index===0?'Source':'Destination'}</small><br/><span dir="ltr">{zone}</span></th><td><time dateTime={new Date(comparison.epoch).toISOString()}>{local}</time></td><td dir="ltr">{offset}</td></tr>)}</tbody>
    </table></div>
    <p data-meeting-summary>{comparison.minuteDifference === 0 ? 'Both locations have the same local time and calendar date.' : `The destination is ${duration} ${comparison.minuteDifference > 0 ? 'ahead of' : 'behind'} the source, on ${dayText}.`} Offsets apply to this date; a different date may change the difference.</p>
  </section>;
}
