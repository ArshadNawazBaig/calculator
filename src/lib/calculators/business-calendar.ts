import {dateUTC,isoDate,dayMs,integer} from './helpers';
import {parseRows,rowNumber} from './row-data';
import {metric as m,type Values,type Result} from './types';
export const holidayNames:Record<string,string>={'new-year':"New Year's Day",mlk:'Martin Luther King Jr. Day',washington:"Washington's Birthday",memorial:'Memorial Day',juneteenth:'Juneteenth',independence:'Independence Day',labor:'Labor Day',columbus:'Columbus Day',veterans:'Veterans Day',thanksgiving:'Thanksgiving',christmas:'Christmas Day'};
const ymd=(year:number,month:number,day:number)=>`${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
export function federalHolidays(year:number,observed=true,selected=Object.keys(holidayNames)){
 const fixed=(month:number,day:number)=>{const d=dateUTC(ymd(year,month,day));if(observed)d.setUTCDate(d.getUTCDate()+(d.getUTCDay()===6?-1:d.getUTCDay()===0?1:0));return isoDate(d);};
 const nth=(month:number,weekday:number,n:number)=>{const first=dateUTC(ymd(year,month,1));return ymd(year,month,1+(weekday-first.getUTCDay()+7)%7+(n-1)*7);};
 const lastMay=dateUTC(ymd(year,5,31));
 const dates:Record<string,string>={'new-year':fixed(1,1),mlk:nth(1,1,3),washington:nth(2,1,3),memorial:ymd(year,5,31-(lastMay.getUTCDay()+6)%7),juneteenth:fixed(6,19),independence:fixed(7,4),labor:nth(9,1,1),columbus:nth(10,1,2),veterans:fixed(11,11),thanksgiving:nth(11,4,4),christmas:fixed(12,25)};
 if(selected.some(key=>!Object.hasOwn(dates,key)))throw Error('Select supported holiday rules.');return selected.map(key=>dates[key]).sort();
}
export function businessCalendar(v:Values,addition:boolean):Result{
 const weekdays=(v.workdays||'').split(',').filter(Boolean).map(Number);if(!weekdays.length||weekdays.some(d=>!Number.isInteger(d)||d<1||d>7))throw Error('Select at least one working weekday.');
 const once=new Set((v.holidays||'').split(/[\s,]+/).filter(Boolean).map(d=>isoDate(dateUTC(d))));
 const recurring=parseRows(v.recurringHolidays||'[]','Annual excluded dates').map(row=>{const month=integer(rowNumber(row.month,'Holiday month'),1,12),day=integer(rowNumber(row.day,'Holiday day'),1,31);dateUTC(ymd(2000,month,day));return {month,day};});
 const selected=(v.selectedHolidayRules??Object.keys(holidayNames).join(',')).split(',').filter(Boolean),cache=new Map<number,Set<string>>();
 const isWork=(date:Date)=>{const year=date.getUTCFullYear();if(year<1||year>9999)throw Error('Result must be between years 0001 and 9999.');
  if(v.holidayPreset==='us-federal-current'&&(year<2021||year>2099))throw Error('The current federal holiday preset supports 2021–2099. Choose custom holidays for other years.');
  let excluded=cache.get(year);if(!excluded){excluded=new Set(once);if(v.holidayPreset==='us-federal-current')for(const y of [year-1,year,year+1])for(const d of federalHolidays(y,v.holidayObservation!=='actual',selected))excluded.add(d);
   for(const row of recurring){try{excluded.add(isoDate(dateUTC(ymd(year,row.month,row.day))));}catch{if(!(row.month===2&&row.day===29))throw Error('Invalid recurring date.');}}cache.set(year,excluded);}
  return weekdays.includes(date.getUTCDay()||7)&&!excluded.has(isoDate(date));
 };
 const start=dateUTC(v.start);isWork(start);const notes=['Count mode includes the start and excludes the end unless selected. Add mode excludes the starting date. Federal observations use the Monday–Friday rule; future dates project rules verified in 2026.'];
 if(addition){const count=integer(Number(v.days),-100000,100000),direction=count<0?-1:1;let remaining=Math.abs(count),cursor=start,steps=0;isWork(start);while(remaining){if(++steps>1000000)throw Error('The requested interval exceeds the supported calendar range.');cursor=new Date(cursor.getTime()+direction*dayMs);if(isWork(cursor))remaining--;}return {metrics:[m('Result date',isoDate(cursor))],notes};}
 const end=dateUTC(v.end),span=Math.abs(end.getTime()-start.getTime())/dayMs;if(span>100000)throw Error('Use at most 100,000 days.');const direction=end>=start?1:-1;let count=0;for(let i=0;i<span+(v.inclusive==='yes'?1:0);i++)if(isWork(new Date(start.getTime()+i*direction*dayMs)))count++;
 return {metrics:[m('Business days',count*direction)],notes};
}
