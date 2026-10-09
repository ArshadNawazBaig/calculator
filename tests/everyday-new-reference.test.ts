import {describe,it,expect} from 'vitest';
import fixtures from './fixtures/everyday-new-reference.json';
import {definitions} from '@/lib/calculators/registry';
import {defaults,type Values} from '@/lib/calculators/types';
import {calculate} from '@/lib/calculators/engine';
import {federalHolidays} from '@/lib/calculators/business-calendar';
import {randomIndex} from '@/lib/calculators/everyday-advanced-engine';

const modes:Record<string,string>={'gpa-letter-percentage-semesters':'semester-grades','timecard-overtime-rounding':'dated-shifts','tile-layout-boxes-price':'procurement','resistor-band-count-options':'bands','fuel-independent-units':'mixed-units','speed-duration-and-units':'measured','password-character-options':'custom','ipv4-dotted-mask-input':'mask'};
const labels:Record<string,string>={cumulativeGpa:'Cumulative GPA',newGradedCredits:'New graded credits',newQualityPoints:'New quality points',totalGradedCredits:'Total graded credits',date:'Result date',businessDays:'Business days',rawHours:'Raw hours',totalHours:'Total hours',regularHours:'Regular hours',overtimeHours:'Overtime hours',grossPay:'Estimated gross pay',columns:'Columns',rows:'Rows',baseTiles:'Base tiles',orderTiles:'Order tiles',boxes:'Boxes',purchasedTiles:'Purchased tiles',packageSurplus:'Package surplus',materialCost:'Material cost',equivalentTiles:'Equivalent tiles',resistanceOhm:'Resistance',tolerancePercent:'Tolerance',minimumOhm:'Minimum resistance',maximumOhm:'Maximum resistance',temperatureCoefficientPpmPerK:'Temperature coefficient',liters:'Fuel required',usGallons:'US gallons',cost:'Fuel cost',metersPerSecond:'Meters per second',speed:'Speed',distance:'Distance',distanceMeters:'Distance in meters',durationSeconds:'Elapsed seconds',durationHms:'Duration',prefix:'Prefix length',network:'Network',broadcast:'Broadcast',totalAddresses:'Total addresses',usableAddresses:'Usable addresses',firstUsable:'First usable',lastUsable:'Last usable'};
type Fixture={id:string;group:string;slug:string;proposedModeId:string;inputs:Record<string,unknown>;expected?:Record<string,unknown>;expectedError?:string;properties?:Record<string,unknown>[]};
describe('Independent expanded everyday references',()=>{for(const f of fixtures as Fixture[])it(f.id,async()=>{
 if(f.proposedModeId==='holiday-generation'){expect(federalHolidays(Number(f.inputs.year))).toEqual(f.expected!.dates);return;}
 if(f.proposedModeId==='random-index'){const bytes=f.inputs.testByteSequence as number[];let at=0;expect(randomIndex(Number(f.inputs.poolSize),()=>bytes[at++])).toBe(f.expected!.index);expect(at).toBe(f.expected!.bytesConsumed);return;}
 const id=f.group==='business-calendar-options'?(f.proposedModeId==='business-add'?'custom-business-add':'custom-business'):modes[f.group];
 const mode=definitions.find(d=>d.slug===f.slug)!.modes.find(m=>m.id===id)!;expect(mode).toBeDefined();
 const values:Values={...defaults(mode)};
 for(const [key,value] of Object.entries(f.inputs)){
  if(key==='gradeScale'){values[key]=JSON.stringify(Object.entries(value as object).map(([grade,points])=>({grade,points:points===null?'exclude':points})));}
  else if(key==='workdays'||key==='selectedHolidayRules')values[key]=(value as string[]).join(',');
  else if(key==='holidays')values[key]=(value as string[]).join('\n');
  else values[key]=typeof value==='object'?JSON.stringify(value):typeof value==='boolean'?(value?'yes':'no'):String(value);
 }
 if(f.proposedModeId==='convert'&&f.group==='speed-duration-and-units')values.solve='convert';
 if(f.proposedModeId==='round-punch'){values.shifts=JSON.stringify([{workDate:'2026-10-09',start:String(f.inputs.time),end:'09:00',breakMinutes:0}]);values.roundMinutes=String(f.inputs.roundMinutes);}
 if(f.expectedError){await expect(calculate('everyday',mode,values)).rejects.toThrow();return;}
 const output=await calculate('everyday',mode,values),metrics=Object.fromEntries(output.metrics.map(m=>[m.label,m.value]));
 for(const [key,expected] of Object.entries(f.expected||{})){
  if(key==='termGpas'){for(const [term,gpa] of Object.entries(expected as object))expect(output.table!.rows.find(row=>row[0]===term)![3]).toBeCloseTo(Number(gpa),10);continue;}
  if(key==='roundedPunches'){expect(output.table!.rows.flatMap(row=>[row[1],row[2]])).toEqual(expected);continue;}
  if(key==='time'){expect(String(output.table!.rows[0][1]).slice(11)).toBe(expected);continue;}
  const actual=key==='network'?String(metrics.Network).split('/')[0]:metrics[labels[key]];expect(actual,`${key}: ${JSON.stringify(metrics)}`).toBeDefined();
  if(typeof expected==='number')expect(Number(actual)).toBeCloseTo(expected,Math.max(0,9-Math.floor(Math.log10(Math.max(1,Math.abs(expected))))));
  else if(key==='durationHms')expect(String(actual).padStart(8,'0')).toBe(expected);else expect(actual).toBe(expected);
 }
 for(const property of f.properties||[]){const passwords=output.table!.rows.map(row=>String(row[0]));
  if(property.passwordCount!==undefined)expect(passwords.length).toBe(property.passwordCount);
  for(const password of passwords){if(property.eachPasswordLength!==undefined)expect(password.length).toBe(property.eachPasswordLength);if(property.eachPasswordSortedEquals!==undefined)expect([...password].sort().join('')).toBe(property.eachPasswordSortedEquals);if(property.eachPasswordExcludes)for(const c of String(property.eachPasswordExcludes))expect(password.includes(c)).toBe(false);if(property.eachPasswordHasClasses)for(const name of property.eachPasswordHasClasses as string[])expect(({lowercase:/[a-z]/,uppercase:/[A-Z]/,digits:/[0-9]/,symbols:/[^a-zA-Z0-9]/}[name])!.test(password)).toBe(true);}
 }
 });});
