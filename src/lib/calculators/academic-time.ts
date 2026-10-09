import {metric as m,type Values,type Result} from './types';
import {parseRows,rowNumber} from './row-data';
import {dateUTC,dayMs} from './helpers';

export const defaultGradeScale:Record<string,number|null>={'A+':4,A:4,'A-':3.7,'B+':3.3,B:3,'B-':2.7,'C+':2.3,C:2,'C-':1.7,'D+':1.3,D:1,'D-':.7,F:0,P:null,NP:null};
export function semesterGpa(v:Values):Result{
 const maximum=rowNumber(v.maximum,'Maximum grade points',.1,100),prior=rowNumber(v.previousCredits,'Previous credits',0),priorGpa=rowNumber(v.previousGpa,'Previous GPA',0,maximum);
 const letters:Record<string,number|null>={};
 if(v.gradeFormat==='letter')for(const row of parseRows(v.gradeScale,'Grade scale')){if(typeof row.grade!=='string')throw Error('Grade symbols must be text.');const grade=row.grade.trim().toUpperCase();if(!grade||grade in letters)throw Error('Use distinct, nonempty grade symbols.');letters[grade]=row.points==='exclude'?null:rowNumber(row.points,'Grade points',0,maximum);}
 const thresholds=v.gradeFormat==='percentage'?parseRows(v.percentScale,'Percentage scale').map(row=>({minimum:rowNumber(row.minimumPercent,'Minimum percentage',0,100),points:rowNumber(row.points,'Grade points',0,maximum)})).sort((a,b)=>b.minimum-a.minimum):[];
 if(v.gradeFormat==='percentage'&&(!thresholds.some(row=>row.minimum===0)||new Set(thresholds.map(row=>row.minimum)).size!==thresholds.length))throw Error('Use unique percentage cutoffs, including a zero cutoff.');
 const terms=new Map<string,{credits:number;quality:number}>();let credits=0,quality=0;
 for(const row of parseRows(v.courses,'Courses')){
  if(row.includeInGpa!==undefined&&!['yes','no',true,false].includes(row.includeInGpa as string|boolean))throw Error('Choose whether to include each course in GPA.');if(!['string','number'].includes(typeof row.grade))throw Error('Course grade must be text or a number.');const cr=rowNumber(row.credits,'Course credits',0);if(row.includeInGpa==='no'||row.includeInGpa===false)continue;
  const grade=String(row.grade??'').trim().toUpperCase();let points:number|null;
  if(v.gradeFormat==='letter'){if(!(grade in letters))throw Error('Choose a defined grade or edit the grade scale.');points=letters[grade];}
  else if(v.gradeFormat==='percentage'){const percent=rowNumber(grade,'Course percentage',0,100);points=thresholds.find(row=>row.minimum<=percent)!.points;}
  else points=rowNumber(grade,'Course grade points',0,maximum);
  if(points===null)continue;if(cr===0)throw Error('Included courses need positive credits.');
  const term=String(row.semester||'Current term'),entry=terms.get(term)||{credits:0,quality:0};entry.credits+=cr;entry.quality+=cr*points;terms.set(term,entry);credits+=cr;quality+=cr*points;
 }
 const total=credits+prior;if(total===0)throw Error('No graded credits.');
 return {metrics:[m('Cumulative GPA',(quality+prior*priorGpa)/total),m('New graded credits',credits),m('New quality points',quality),m('Total graded credits',total)],table:{headers:['Semester','Graded credits','Quality points','GPA'],rows:[...terms].map(([name,t])=>[name,t.credits,t.quality,t.quality/t.credits])},notes:['The editable scales are examples. Your institution determines exclusions, transfer credits, repeated-course treatment, and rounding.']};
}
function punch(raw:unknown){if(typeof raw!=='string')throw Error('Clock times must be text.');const match=String(raw).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);if(!match||Number(match[1])>23||Number(match[2])>59||Number(match[3]||0)>59)throw Error('Use valid HH:MM or HH:MM:SS clock times.');return Number(match[1])*3600+Number(match[2])*60+Number(match[3]||0);}
function civil(seconds:number){const date=new Date(seconds*1000);if(!Number.isFinite(date.getTime())||date.getUTCFullYear()<1||date.getUTCFullYear()>9999)throw Error('Rounded shift dates must remain within years 0001–9999.');return date.toISOString().slice(0,19);}
export function shiftCard(v:Values):Result{
 const quantum=rowNumber(v.roundMinutes,'Rounding interval',0,60)*60,threshold=rowNumber(v.threshold,'Overtime threshold',0),rate=rowNumber(v.rate,'Hourly rate',0),multiplier=rowNumber(v.multiplier,'Overtime multiplier',1);
 const shifts=parseRows(v.shifts,'Shifts');if(!shifts.length)throw Error('Add at least one shift.');
 const byDay=new Map<string,number>(),ranges:{start:number;end:number}[]=[];let total=0,rawTotal=0;
 const round=(seconds:number)=>quantum?quantum*Math.floor((seconds+quantum/2)/quantum):seconds;
 const rows=shifts.map(row=>{if(typeof row.workDate!=='string')throw Error('Work date must be text.');const day=row.workDate,base=dateUTC(day).getTime()/1000,start=base+punch(row.start);let end=base+punch(row.end);if(end<start)end+=dayMs/1000;
  const br=rowNumber(row.breakMinutes,'Break minutes',0)*60,roundedStart=round(start),roundedEnd=round(end),raw=end-start-br,net=roundedEnd-roundedStart-br;
  if(raw<0||net<0)throw Error('Break cannot exceed raw or rounded shift duration.');
  if(ranges.some(range=>start<range.end&&end>range.start))throw Error('Shifts cannot overlap.');ranges.push({start,end});
  total+=net/3600;rawTotal+=raw/3600;byDay.set(day,(byDay.get(day)||0)+net/3600);
  return [day,civil(roundedStart),civil(roundedEnd),raw/3600,net/3600];
 });
 if(v.overtimeMode==='weekly'){const days=[...byDay.keys()].sort();if((dateUTC(days.at(-1)!).getTime()-dateUTC(days[0]).getTime())/dayMs>6)throw Error('Weekly overtime accepts one seven-day workweek. Split longer periods into separate calculations.');}
 const overtime=v.overtimeMode==='daily'?[...byDay.values()].reduce((sum,h)=>sum+Math.max(0,h-threshold),0):v.overtimeMode==='weekly'?Math.max(0,total-threshold):0;
 return {metrics:[m('Raw hours',rawTotal),m('Total hours',total),m('Regular hours',total-overtime),m('Overtime hours',overtime),m('Estimated gross pay',((total-overtime)+overtime*multiplier)*rate,'money')],table:{headers:['Work date','Rounded start','Rounded end','Raw hours','Payable hours'],rows},notes:['Civil-time estimate: no daylight-saving adjustments. Overnight hours are assigned to the starting work date. This is an entered overtime policy, not a determination of payroll-law compliance. Rounding ties move to the later time.']};
}
