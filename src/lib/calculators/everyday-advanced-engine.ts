import Decimal from 'decimal.js';
import {metric as m,type Values,type Result} from './types';
import {num,integer,positive,result} from './helpers';
import {semesterGpa,shiftCard} from './academic-time';
import {businessCalendar} from './business-calendar';

export const advancedEverydayAlgorithms=new Set(['semester-gpa','shift-card','calendar-count','calendar-add','tile-procurement','resistor-bands','fuel-units','speed-units','password-uniform','ipv4-mask']);
export const digitColors=['black','brown','red','orange','yellow','green','blue','violet','gray','white'];
export const tolerances:Record<string,number>={brown:1,red:2,green:.5,blue:.25,violet:.1,gray:.05,gold:5,silver:10};
export const tempcos:Record<string,number>={black:250,brown:100,red:50,orange:15,yellow:25,green:20,blue:10,violet:5,gray:1};
const lengthFactors:Record<string,number>={mm:.001,cm:.01,m:1,km:1000,in:.0254,ft:.3048,yd:.9144,mi:1609.344};
const speedFactors:Record<string,number>={'m/s':1,'km/h':1/3.6,mph:.44704,knots:1852/3600,'ft/s':.3048,'cm/s':.01};
function factor(table:Record<string,number>,key:string){if(!(key in table))throw Error('Select a supported unit.');return table[key];}
export function randomIndex(size:number,draw:()=>number=()=>{const b=new Uint8Array(1);globalThis.crypto.getRandomValues(b);return b[0];}){integer(size,1,256);const limit=Math.floor(256/size)*size;for(let i=0;i<10000;i++){const byte=integer(draw(),0,255);if(byte<limit)return byte%size;}throw Error('Random generation could not complete. Try again.');}
export function passwordUniform(v:Values):Result{
 const enabled=(key:string)=>v[key]==='yes'||v[key]==='true';
 const pools:Record<string,string>={lowercase:'abcdefghijklmnopqrstuvwxyz',uppercase:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',digits:'0123456789',symbols:'!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'};
 const exclude=(v.ambiguous!=='include'?'0O1Il':'')+(enabled('excludeBrackets')?'()[]{}<>':'');
 const classes=Object.entries(pools).filter(([key])=>enabled(key)).map(([,pool])=>[...pool].filter(c=>!exclude.includes(c)).join(''));
 if(!classes.length||classes.some(pool=>!pool.length))throw Error('Select at least one available character class.');
 const pool=classes.join(''),length=integer(num(v,'length'),8,128),count=integer(num(v,'count'),1,20),unique=enabled('unique');
 if(unique&&length>pool.length)throw Error(`Only ${pool.length} different characters remain; shorten the password or allow repetition.`);
 const passwords:string[]=[];
 for(let i=0;i<count;i++){let accepted=false;for(let attempt=0;attempt<10000;attempt++){let candidate:string;if(unique){const shuffled=[...pool];for(let j=shuffled.length-1;j>0;j--){const k=randomIndex(j+1);[shuffled[j],shuffled[k]]=[shuffled[k],shuffled[j]];}candidate=shuffled.slice(0,length).join('');}else candidate=Array.from({length},()=>pool[randomIndex(pool.length)]).join('');if(classes.every(chars=>[...candidate].some(c=>chars.includes(c)))){passwords.push(candidate);accepted=true;break;}}if(!accepted)throw Error('Random generation could not satisfy the selected constraints. Try again.');}
 return {metrics:[m('Passwords generated',count),m('Characters per password',length)],table:{headers:['Password'],rows:passwords.map(p=>[p])},notes:['Passwords are generated locally with cryptographic randomness. Each selected class appears. Avoid sharing or printing these results.']};
}
export function runAdvancedEveryday(op:string,v:Values,base:(a:string,v:Values)=>Result):Result{
 const n=(key:string)=>num(v,key);
 if(op==='semester-gpa')return semesterGpa(v);
 if(op==='shift-card')return shiftCard(v);
 if(op==='calendar-count'||op==='calendar-add')return businessCalendar(v,op==='calendar-add');
 if(op==='password-uniform')return passwordUniform(v);
 if(op==='resistor-bands'){
  const count=integer(n('bandCount'),3,6),digit=(key:string)=>{const index=digitColors.indexOf(v[key]);if(index<0)throw Error('Select a digit color.');return index;};
  const exponent=v.multiplier==='gold'?-1:v.multiplier==='silver'?-2:digitColors.indexOf(v.multiplier);if(exponent<0&&!['gold','silver'].includes(v.multiplier))throw Error('Select a multiplier color.');
  const resistance=(count>=5?100*digit('a')+10*digit('b')+digit('c'):10*digit('a')+digit('b'))*10**exponent,tolerance=count===3?20:tolerances[v.tolerance];if(tolerance===undefined)throw Error('Tolerance color is not in the supported reference table.');
  const metrics=[m('Resistance',resistance,'number','Ω'),m('Tolerance',tolerance,'percent'),m('Minimum resistance',resistance*(1-tolerance/100),'number','Ω'),m('Maximum resistance',resistance*(1+tolerance/100),'number','Ω')];
  if(count===6){if(tempcos[v.temperatureCoefficient]===undefined)throw Error('Select a supported temperature-coefficient color.');metrics.push(m('Temperature coefficient',tempcos[v.temperatureCoefficient],'number','ppm/K'));}return {metrics,notes:['Unusual leading-zero markings should be checked against the manufacturer. The sixth-band coefficient is a class magnitude, not a signed measured temperature response.']};
 }
 if(op==='fuel-units'){
  const distance=n('distance')*factor({km:1,mi:1.609344},v.distanceUnit),economy=positive(n('economy'),'Economy'),litersPerKm=v.economyUnit==='L/100km'?economy/100:v.economyUnit==='km/L'?1/economy:v.economyUnit==='US-mpg'?3.785411784/(1.609344*economy):v.economyUnit==='UK-mpg'?4.54609/(1.609344*economy):v.economyUnit==='L/mi'?economy/1.609344:NaN;
  const liters=distance*litersPerKm,price=n('price')/factor({'per-L':1,'per-US-gal':3.785411784,'per-UK-gal':4.54609},v.priceUnit);
  return {metrics:[m('Fuel required',liters,'number','L'),m('US gallons',liters/3.785411784),m('Fuel cost',liters*price,'number',v.currency),m('Cost per kilometer',litersPerKm*price,'number',v.currency)],notes:['Currency is a display label. No exchange-rate conversion is applied.']};
 }
 if(op==='speed-units'){
  const checkDuration=(seconds:number)=>{if(seconds<0)throw Error('Duration cannot be negative.');return v.solve==='speed'?positive(seconds,'Duration'):seconds;};const duration=()=>{if(v.durationFormat==='decimal-hours')return checkDuration(n('duration')*3600);const match=v.duration.match(/^(\d{1,9}):(\d{2}):(\d{2}(?:\.\d+)?)$/);if(!match||Number(match[2])>=60||Number(match[3])>=60)throw Error('Use elapsed HH:MM:SS, with minutes and seconds below 60.');return checkDuration(Number(match[1])*3600+Number(match[2])*60+Number(match[3]));};
  if(v.solve==='convert'){const speed=n('speed')*factor(speedFactors,v.speedUnit);return result(m('Speed',speed/factor(speedFactors,v.outputSpeedUnit),'number',v.outputSpeedUnit),m('Meters per second',speed));}
  let seconds=0,meters=0,speed=0;
  if(v.solve==='speed'){seconds=duration();meters=n('distance')*factor(lengthFactors,v.distanceUnit);speed=meters/seconds;}
  else if(v.solve==='distance'){seconds=duration();speed=n('speed')*factor(speedFactors,v.speedUnit);meters=speed*seconds;}
  else {meters=n('distance')*factor(lengthFactors,v.distanceUnit);speed=positive(n('speed'),'Speed')*factor(speedFactors,v.speedUnit);seconds=meters/speed;}
  if(!Number.isFinite(seconds)||seconds>Number.MAX_SAFE_INTEGER)throw Error('Duration is outside the supported range.');const rounded=Math.round(seconds),hms=`${Math.floor(rounded/3600)}:${String(Math.floor(rounded%3600/60)).padStart(2,'0')}:${String(rounded%60).padStart(2,'0')}`;
  return result(m('Speed',speed/factor(speedFactors,v.outputSpeedUnit),'number',v.outputSpeedUnit),m('Meters per second',speed),m('Distance',meters/factor(lengthFactors,v.outputDistanceUnit),'number',v.outputDistanceUnit),m('Distance in meters',meters),m('Duration',hms),m('Elapsed seconds',seconds),m('Decimal hours',seconds/3600));
 }
 if(op==='tile-procurement'){
  const f=factor(lengthFactors,v.lengthUnit),d=(key:string)=>new Decimal(v[key]),tl=d('tileLength').times(f),tw=d('tileWidth').times(f),gap=d('gap').times(f);if(tl.lte(0)||tw.lte(0)||gap.lt(0))throw Error('Tile dimensions must be positive and grout width nonnegative.');
  const length=d('length').times(f),width=d('width').times(f),area=v.areaInput==='known-area'?d('area').times(factor({m2:1,ft2:.09290304,yd2:.83612736,cm2:.0001,mm2:.000001},v.areaUnit)):length.times(width);if(area.lte(0))throw Error('Coverage area must be positive.');
  const grid=v.layoutModel==='straight-grid-no-offcut-reuse';if(grid&&v.areaInput==='known-area')throw Error('Grid counting requires room dimensions.');
  const cols=grid?length.plus(gap).div(tl.plus(gap)).ceil():new Decimal(0),rows=grid?width.plus(gap).div(tw.plus(gap)).ceil():new Decimal(0),equivalent=grid?cols.times(rows):area.div(tl.plus(gap).times(tw.plus(gap))),needed=equivalent.times(d('waste').div(100).plus(1)).ceil(),perBox=integer(n('tilesPerBox'),1,1000000),boxes=needed.div(perBox).ceil();
  if(v.priceBasis==='box'&&v.purchaseBasis!=='box')throw Error('Choose box purchasing for a per-box price.');
  const purchased=v.purchaseBasis==='box'?boxes.times(perBox):needed,cost=v.priceBasis==='box'?boxes.times(d('price')):v.priceBasis==='tile'?purchased.times(d('price')):purchased.times(tl).times(tw).div(factor({m2:1,ft2:.09290304,yd2:.83612736,cm2:.0001,mm2:.000001},v.areaUnit)).times(d('price'));
  if(purchased.gt(Number.MAX_SAFE_INTEGER))throw Error('Tile quantity exceeds the supported range.');
  return {metrics:[...(grid?[m('Columns',cols.toNumber()),m('Rows',rows.toNumber()),m('Base tiles',equivalent.toNumber())]:[m('Equivalent tiles',equivalent.toNumber())]),m('Order tiles',needed.toNumber()),m('Boxes',boxes.toNumber()),m('Purchased tiles',purchased.toNumber()),m('Package surplus',purchased.minus(needed).toNumber()),m('Material cost',cost.toNumber(),'money')],notes:[grid?'Straight rows with no offcut reuse; orientation follows the entered tile dimensions.':'Area estimate uses periodic tile-plus-grout modules. Actual edge cuts require a measured layout.','Allowance is applied before rounding the order quantity.']};
 }
 if(op==='ipv4-mask'){
  const parse=(raw:string)=>{if(!/^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(raw)||raw.split('.').some(s=>Number(s)>255))throw Error('Use four decimal octets from 0 to 255, without leading zeros.');return raw.split('.').reduce((n,x)=>(n<<8n)+BigInt(x),0n);};parse(v.address);
  let prefix=integer(n('prefix'),0,32);if(v.maskInput==='dotted-mask'){const host=(~parse(v.mask))&0xffffffffn;if((host&(host+1n))!==0n)throw Error('Subnet mask must have contiguous leading one bits.');prefix=32-(host===0n?0:host.toString(2).length);}
  const output=base('ipv4',{...v,prefix:String(prefix)});output.metrics.push(m('Prefix length',prefix));return output;
 }
 throw Error('Unsupported extended everyday mode.');
}
