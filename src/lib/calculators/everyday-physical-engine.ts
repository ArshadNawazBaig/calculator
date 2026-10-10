import Decimal from 'decimal.js';
import {metric as m,numericTextMetric as textMetric,type Values,type Result} from './types';
import {num,positive,integer,result,dateUTC,dayMs} from './helpers';
import {lengths,powerUnits,masses,liters,molarUnits,massConcentrations,dataBits,rateBits,unitFactor as f} from './physical-units';
export const physicalEverydayAlgorithms=new Set(['power-units','power-work-units','molarity-units','income-gdp','fixed-time-zone','data-units','transfer-units','website-units','tire-target','height-units','parent-height-units','quarter-mile']);
function feetInches(feet:number,inches:number){integer(feet,0,10000);if(inches<0||inches>=12)throw Error('Inches must be from zero to less than twelve.');return (feet*12+inches)*2.54;}
export function runPhysicalEveryday(op:string,v:Values):Result{
 const n=(key:string,otherwise?:number)=>num(v,key,otherwise);
 if(op==='power-units')return result(m('Converted power',n('value')*f(powerUnits,v.from)/f(powerUnits,v.to),'number',v.to));
 if(op==='power-work-units'){const watts=n('force')*f({N:1,kN:1000,lbf:4.4482216152605,kgf:9.80665},v.forceUnit)*n('distance')*f(lengths,v.distanceUnit)/(positive(n('time'),'Time')*f({s:1,min:60,h:3600,day:86400},v.timeUnit));return result(m('Power',watts,'number','W'),m('Mechanical horsepower',watts/powerUnits['hp-mechanical']));}
 if(op==='molarity-units'){
  const mass=n('mass')*f(masses,v.massUnit),volume=n('volume')*f(liters,v.volumeUnit),mw=n('molarMass')*f({'g/mol':1,'kg/mol':1000},v.molarMassUnit),input=v.concentrationUnit,output=v.outputUnit;
  const density=()=>positive(n('solutionDensity'),'Solution density'),massFactor=(unit:string)=>unit==='ppm-mass'?density()/1000:unit==='ppb-mass'?density()/1e6:f(massConcentrations,unit),isMolar=Object.hasOwn(molarUnits,input);
  let concentration=0,q=0;
  if(v.solve==='concentration'){q=mass/positive(volume,'Final solution volume');concentration=q/positive(mw,'Molar mass');}
  else {if(isMolar){concentration=n('concentration')*f(molarUnits,input);q=concentration*positive(mw,'Molar mass');}else{q=n('concentration')*massFactor(input);concentration=q/positive(mw,'Molar mass');}}
  if(v.solve==='mass'){const grams=q*volume;return result(m('Solute mass',grams/f(masses,v.outputMassUnit),'number',v.outputMassUnit),m('Mass in grams',grams));}
  if(v.solve==='volume'){const litersOut=mass/positive(q,'Mass concentration');return result(m('Solution volume',litersOut/f(liters,v.outputVolumeUnit),'number',v.outputVolumeUnit),m('Volume in milliliters',litersOut*1000));}
  if(v.solve==='molarMass'){if(!isMolar)throw Error('Mass concentration alone cannot determine molar mass.');return result(m('Molar mass',mass/(positive(concentration,'Molarity')*positive(volume,'Volume')),'number','g/mol'));}
  const converted=Object.hasOwn(molarUnits,output)?concentration/f(molarUnits,output):q/massFactor(output);
  return result(m('Concentration',converted,'number',output),m('Molarity',concentration,'number','mol/L'),m('Mass concentration',q,'number','g/L'));
 }
 if(op==='income-gdp'){
  const factor=n('compensation')+(v.components==='aggregate'?n('netOperatingSurplus'):n('proprietors')+n('rents')+n('profits')+n('netInterest')+n('otherIncome')),gross=factor+n('taxesLessSubsidies')+n('capitalConsumption'),domestic=gross+(v.componentBasis==='national-factor-income'?n('netPaymentsAbroad'):0);
  return {metrics:[m('Net factor income',factor),...(v.componentBasis==='national-factor-income'?[m('Gross national income estimate',gross)]:[]),m('Gross domestic income estimate',domestic),m('Reconciled GDP estimate',domestic+n('statisticalDiscrepancy'))],notes:['Use consistent currency, scaling, period and net-income definitions. A national-to-domestic bridge adds payments abroad minus receipts. GDI differs from measured GDP by the statistical discrepancy; this form does not retrieve official national accounts.']};
 }
 if(op==='fixed-time-zone'){
  const offset=(raw:string)=>{const match=raw.match(/^([+-])(\d{2}):(\d{2})$/);if(!match||Number(match[3])>=60||Number(match[2])>14||(Number(match[2])===14&&Number(match[3])!==0))throw Error('Use a signed offset from −14:00 to +14:00.');return (match[1]==='-'?-1:1)*(Number(match[2])*60+Number(match[3]));};
  const clock=v.time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);if(!clock||Number(clock[1])>23||Number(clock[2])>59||Number(clock[3]||0)>59)throw Error('Enter a valid clock time.');const source=dateUTC(v.date).getTime()+(Number(clock[1])*3600+Number(clock[2])*60+Number(clock[3]||0))*1000,utc=source-offset(v.fromOffset)*60000,destination=new Date(utc+offset(v.toOffset)*60000);
  if(destination.getUTCFullYear()<1||destination.getUTCFullYear()>9999)throw Error('Converted date lies outside years 0001–9999.');return {metrics:[m('Destination local time',destination.toISOString().slice(0,19)),m('Source offset minutes',offset(v.fromOffset)),m('Destination offset minutes',offset(v.toOffset))],notes:['Fixed offsets have no daylight-saving or historical timezone rules. Use named-zone mode for those rules.']};
 }
 if(op==='data-units'||op==='transfer-units'||op==='website-units'){
  const factor=(table:Record<string,string>,key:string)=>{if(!Object.hasOwn(table,key))throw Error('Select an exact data-unit label; uppercase B means bytes.');return new Decimal(table[key]);},d=(key:string)=>new Decimal(v[key]);
  if(op==='data-units')return result(textMetric('Converted data',d('value').times(factor(dataBits,v.from)).div(factor(dataBits,v.to)).toString(),v.to));
  if(op==='transfer-units'){positive(n('rate'),'Transfer rate');return result(textMetric('Transfer seconds',d('size').times(factor(dataBits,v.sizeUnit)).div(d('rate').times(factor(rateBits,v.rateUnit))).toString(),'seconds'));}
  const days=v.periodBasis==='calendar-dates'?(dateUTC(v.outputEnd).getTime()-dateUTC(v.outputStart).getTime())/dayMs:positive(n('outputDays'),'Report days');positive(days,'Report duration');
  const periods:Record<string,number>={second:1,minute:60,hour:3600,day:86400,week:604800,month:positive(n('monthDays'))*86400,year:positive(n('yearDays'))*86400},multiplier=v.redundancyMode==='multiplier'?n('redundancy'):1+n('redundancy')/100;if(multiplier<1)throw Error('A redundancy multiplier must be at least one.');const bps=d('pageviews').div(f(periods,v.viewPeriod)).times(d('pageSize')).times(factor(dataBits,v.pageSizeUnit)).times(multiplier),gb=bps.times(days).times(86400).div(8e9);
  return result(m('Reporting days',days),textMetric('Average bandwidth',bps.div(1e6).toString(),'Mbps'),textMetric('Transferred data',gb.toString(),'GB'));
 }
 if(op==='tire-target'){
  const width=positive(n('width')),aspect=positive(n('aspect')),rim=positive(n('rim')),side=width*aspect/100,diameter=rim*25.4+2*side,circumference=Math.PI*diameter,metrics=[m('Sidewall',side,'number','mm'),m('Nominal diameter',diameter,'number','mm'),m('Circumference',circumference,'number','mm'),m('Revolutions per kilometer',1e6/circumference),m('Revolutions per mile',1609344/circumference)];
  if(v.comparison!=='single'){const newSide=(diameter-n('alternativeRim')*25.4)/2;if(newSide<=0)throw Error('New rim leaves no positive sidewall at the target diameter.');metrics.push(m('Target sidewall',newSide,'number','mm'),m('Target aspect ratio',newSide/positive(n('alternativeWidth'))*100,'percent'));if(v.comparison==='candidate'){const candidate=n('alternativeRim')*25.4+2*n('alternativeWidth')*n('candidateAspect')/100;metrics.push(m('Candidate diameter',candidate,'number','mm'),m('Diameter difference',(candidate/diameter-1)*100,'percent'),m('Circumference-based actual speed',n('indicatedSpeed')*candidate/diameter));}}
  return {metrics,notes:['Nominal unloaded geometry, not a fitment approval or an available-size catalog. Load rating, rim compatibility, clearance and actual rolling radius require separate checks.']};
 }
 if(op==='height-units'){
  const cm=v.direction==='feet-inches-to-cm'?feetInches(n('feet'),n('inches')):n('centimeters'),total=cm/2.54;let feet=Math.floor(total/12),inches=Number((total-feet*12).toFixed(8));if(inches>=12){feet++;inches=0;}return result(m('Centimeters',cm,'number','cm'),m('Whole feet',feet),m('Remaining inches',inches));
 }
 if(op==='parent-height-units'){const mother=v.parentUnit==='feet-inches'?feetInches(n('motherFeet'),n('motherInches')):n('mother'),father=v.parentUnit==='feet-inches'?feetInches(n('fatherFeet'),n('fatherInches')):n('father');if(mother<100||mother>230||father<100||father>250)throw Error('Parent heights are outside this estimate’s supported range.');return {metrics:[m('Mid-parental estimate',(mother+father+(v.sex==='male'?13:-13))/2,'number','cm'),m('Mother height',mother,'number','cm'),m('Father height',father,'number','cm')],notes:['The same 13 cm sex coefficient is retained across units. This is a broad family-based estimate.']};}
 if(op==='quarter-mile'){
  const weight=positive(n('raceWeight'))*f({lb:1,kg:1/.45359237,'US-short-ton':2000},v.massUnit),hp=v.method==='et'?weight*(5.825/(positive(n('elapsed'),'Elapsed time')*f({s:1,min:60,h:3600,day:86400},v.timeUnit)))**3:weight*(positive(n('trapSpeed'),'Trap speed')*f({mph:1,'km/h':1/1.609344,'m/s':3600/1609.344},v.speedUnit)/234)**3;
  return {metrics:[m('Empirical horsepower estimate',hp,'number','hp')],notes:['Quarter-mile estimates from historical empirical coefficients 5.825 and 234. Use total race weight and elapsed time excluding reaction time, or measured trap speed. This does not establish exact crank or wheel power; traction, drag and conditions affect the result.']};
 }
 throw Error('Unsupported physical-unit mode.');
}
