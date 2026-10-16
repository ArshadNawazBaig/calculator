import {type Locale, languages} from '@/lib/i18n/config';
import {offsetMinutes, offsetLabel} from '@/lib/time/engine';
import copy from '@/data/locales/learning-demos.json';
import styles from '@/components/content/explanation.module.css';

export function TimeExample({mode,locale='en'}: {mode:'timer'|'stopwatch'|'directory';locale?:Locale}) {
  const text=copy[locale], number=new Intl.NumberFormat(languages[locale].tag);
  const title = mode==='timer'?text.timerTitle:mode==='stopwatch'?text.stopwatchTitle:text.zoneTitle;
  const note = mode==='timer'?text.timerNote:mode==='stopwatch'?text.stopwatchNote:text.zoneNote;
  const headers=mode==='timer'?[text.elapsed,text.remaining]:mode==='stopwatch'?[text.lap,text.duration,text.total]:[text.zone,'2026-01-15 (UTC)','2026-07-15 (UTC)'];
  const rows = mode==='timer' ? [['00:00','05:00'],['01:40','03:20'],['05:00','00:00']] : mode==='stopwatch' ? [[number.format(1),'00:15','00:15'],[number.format(2),'00:18','00:33'],[number.format(3),'00:12','00:45']] : ['America/New_York','Etc/GMT+5'].map(zone=>[zone,...[0,6].map(month=>offsetLabel(offsetMinutes(Date.UTC(2026,month,15,12),zone)))]);
  return <section className={styles.panel} data-time-example><h2>{title}</h2><p>{note}</p><div className={styles.scroll} role="region" aria-label={title} tabIndex={0}><table className={styles.table}><thead><tr>{headers.map(header=><th scope="col" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={index}>{row.map((value,column)=>column===0?<th scope="row" key={column} dir="auto">{value}</th>:<td key={column} dir="ltr">{value}</td>)}</tr>)}</tbody></table></div></section>;
}
