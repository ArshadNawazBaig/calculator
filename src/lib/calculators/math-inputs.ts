import type {Mode,Values,Result} from './types';
export const lengthUnits:[string,string][]=[['m','Meters'],['cm','Centimeters'],['mm','Millimeters'],['km','Kilometers'],['in','Inches'],['ft','Feet'],['yd','Yards'],['mi','Miles']];
const factors:Record<string,number>={m:1,cm:.01,mm:.001,km:1000,in:.0254,ft:.3048,yd:.9144,mi:1609.344};
export function angleLiteral(raw:string):number{
  const text=raw.replace(/\s/g,'').replaceAll('π','pi');
  if(text.length>80)throw Error('Use a shorter angle.');
  if(/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(text)){const value=Number(text);if(Number.isFinite(value))return value;}
  const match=text.match(/^([-+]?(?:\d+(?:\.\d*)?|\.\d+)?)\*?pi(?:\/([-+]?(?:\d+(?:\.\d*)?|\.\d+)))?$/i);
  if(!match)throw Error('Use a numeric angle or a simple pi expression, such as pi/6 or 2*pi/3.');
  const coefficient=match[1]===''||match[1]==='+'?1:match[1]==='-'?-1:Number(match[1]),divisor=match[2]===undefined?1:Number(match[2]);
  if(!divisor)throw Error('The angle divisor cannot be zero.');const value=coefficient*Math.PI/divisor;if(!Number.isFinite(value))throw Error('Angle is outside the finite range.');return value;
}
export function scientificLiteral(raw:string){
  const text=raw.trim();const match=text.match(/^([-+]?(?:\d+(?:\.\d*)?|\.\d+))\s*[x×*]\s*10\s*\^\s*([-+]?\d+)$/i);
  return match?`${match[1]}e${match[2]}`:text;
}
export function prepareMathInputs(mode:Mode,original:Values):Values{
  const v={...original};
  if(v.angleUnit){
    const keys=mode.algorithm==='right-pair'?v.pair.split(',').flatMap((k,i)=>['A','B'].includes(k)?[i?'second':'first']:[]):mode.fields.filter(f=>f.unit==='angle').map(f=>f.key);
    for(const key of keys)v[key]=String(angleLiteral(v[key])*(v.angleUnit==='rad'?180/Math.PI:1));
    delete v.angleUnit;
  }
  if(v.outputUnit){
    const output=factors[v.outputUnit];if(!output)throw Error('Select a supported output unit.');
    for(const field of mode.fields){if(field.key.endsWith('Unit')&&!['outputUnit','angleUnit'].includes(field.key)){
      const key=field.key.slice(0,-4);if(!factors[v[field.key]])throw Error('Select a supported dimension unit.');
      v[key]=String(Number(v[key])*factors[v[field.key]]/output);delete v[field.key];
    }}
    delete v.outputUnit;
  }
  if(mode.algorithm==='log'||mode.algorithm==='log-inverse')for(const key of ['base','value'])if(v[key]?.trim()==='e')v[key]=String(Math.E);
  if(['scientific-notation','scientific-arithmetic'].includes(mode.algorithm))for(const key of ['value','a','b'])if(v[key]!==undefined)v[key]=scientificLiteral(v[key]);
  return v;
}
export function mathOutputUnits(result:Result,unit:string|undefined):Result{
  if(!unit)return result;
  return {...result,metrics:result.metrics.map(m=>({...m,unit:/volume/i.test(m.label)?`${unit}³`:/area/i.test(m.label)?`${unit}²`:m.unit==='°'||/angle|solutions/i.test(m.label)?m.unit:typeof m.value==='number'?unit:m.unit}))};
}
export function dmsCoordinate(raw:string,limit:number):number{
  const match=raw.trim().match(/^(\d+(?:\.\d+)?)\s*[°:,\s]\s*(\d+(?:\.\d+)?)\s*['′:,\s]\s*(\d+(?:\.\d+)?)\s*["″]?\s*([NSEW])$/i);
  if(!match)throw Error('Use degrees minutes seconds and hemisphere, such as 40 42 51 N.');
  const d=Number(match[1]),m=Number(match[2]),s=Number(match[3]),hemisphere=match[4].toUpperCase();
  if(!Number.isInteger(d)||!Number.isInteger(m)||m>=60||s>=60||d>limit||(d===limit&&(m!==0||s!==0))||(limit===90?!['N','S'].includes(hemisphere):!['E','W'].includes(hemisphere)))throw Error('Check DMS degrees, minutes, seconds, and the latitude/longitude hemisphere.');
  return (d+m/60+s/3600)*(['S','W'].includes(hemisphere)?-1:1);
}
