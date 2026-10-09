import Decimal from 'decimal.js';
import {metric as m,type Values,type Result} from './types';
import {num,positive,integer,result} from './helpers';
import {lengths,areas,volumes,unitFactor as f} from './physical-units';
import {triangleSides} from './geometry';
export const constructionAlgorithms=new Set(['floor-measured','concrete-measured','roof-measured','roof-packages','stairs-layout','voltage-impedance','wire-gauge']);
export function runConstruction(op:string,v:Values):Result{
 const n=(key:string)=>num(v,key),length=(key:string)=>n(key)*f(lengths,v[key+'Unit']||v.unit),quantity=()=>integer(n('quantity'),1,10000);
 if(op==='floor-measured'){
  let area=0;const a=length('length'),b=length('width'),c=length('border');
  if(v.shape==='rectangle'||v.shape==='parallelogram')area=a*b;
  else if(v.shape==='circle')area=Math.PI*(length('outerDiameter')/2)**2;
  else if(v.shape==='ring'){const r=length('outerDiameter')/2;if(c>r)throw Error('Border exceeds the outer radius.');area=Math.PI*c*(2*r-c);}
  else if(v.shape==='border'){if(2*c>Math.min(a,b))throw Error('Twice the border exceeds the outer dimensions.');area=2*c*(a+b-2*c);}
  else if(v.shape==='triangle')area=Number(triangleSides(a,b,length('sideC')).metrics[0].value);
  else if(v.shape==='base-height')area=a*b/2;
  else if(v.shape==='trapezoid')area=(a+b)*length('height')/2;
  else if(v.shape==='sector')area=Math.PI*length('radius')**2*n('angle')/360;
  else throw Error('Select a floor shape.');
  area*=quantity();return result(m('Area in square meters',area,'number','m²'),m('Area in square feet',area/areas.ft2,'number','ft²'),m('Estimated area cost',area/f(areas,v.priceAreaUnit)*n('price'),'money'));
 }
 if(op==='concrete-measured'){
  let net=0,section:number|undefined;
  if(v.shape==='slab')net=length('length')*length('width')*length('depth');
  if(v.shape==='column')net=Math.PI*(length('outer')/2)**2*length('height');
  if(v.shape==='tube'){const outer=length('outer'),inner=length('inner');if(inner>=outer)throw Error('Inner diameter must be less than outer diameter.');net=Math.PI*(outer-inner)*(outer+inner)/4*length('height');}
  if(v.shape==='stairs'){const count=integer(n('risers'),1,200);net=length('width')*length('riser')*(length('run')*count*(count-1)/2+length('platform')*count);}
  if(v.shape==='curb'){section=(length('curbDepth')+length('gutterWidth'))*length('flagThickness')+length('curbDepth')*length('curbHeight');net=section*length('length');}
  net*=quantity();const order=net*(1+n('waste')/100);
  return {metrics:[...(section!==undefined?[m('Cross-section area',section,'number','m²')]:[]),m('Net volume',net,'number','m³'),m('Net cubic feet',net/volumes.ft3),m('Net cubic yards',net/volumes.yd3),m('Order volume',order,'number','m³'),m('Order cubic feet',order/volumes.ft3),m('Material cost',(v.priceBasis==='net'?net:order)/f(volumes,v.priceVolumeUnit)*n('price'),'money')],notes:[v.shape==='curb'?'Curb height is above the flag slab. Exposed gutter width excludes the curb. Sharp rectangular section; no chamfers or battered faces are included.':v.shape==='stairs'?'Solid stair block to ground with N risers, N−1 ordinary treads and a full-height platform.':'Dimensions describe the net geometric volume before allowance.']};
 }
 if(op==='roof-measured'){
  const factor=f(lengths,v.unit),eaves=n('eaves')*factor,plan=v.planInput==='known-horizontal-area'?n('planArea')*f(areas,v.areaUnit):(n('length')*factor+2*eaves)*(n('width')*factor+2*eaves),pitch=n('pitch');if(v.slopeInput==='degrees'&&(pitch<0||pitch>=90))throw Error('Roof angle must be from zero to below 90 degrees.');const slope=v.slopeInput==='degrees'?1/Math.cos(pitch*Math.PI/180):Math.hypot(1,pitch/12),net=plan*slope,order=net*(1+n('waste')/100);
  return {metrics:[m('Horizontal area',plan,'number','m²'),m('Horizontal square feet',plan/areas.ft2),m('Net roof area',net,'number','m²'),m('Net roof square feet',net/areas.ft2),m('Order roof area',order,'number','m²'),m('Order roof square feet',order/areas.ft2),m('Area-based cost',(v.priceBasis==='net-roof'?net:order)/f(areas,v.priceAreaUnit)*n('price'),'money')],notes:['Uniform slope across the projected area. Rectangle overhang extends on all four sides; a known area must already include overhangs. Calculate roofs with different slopes as separate sections.']};
 }
 if(op==='roof-packages'){
  const order=new Decimal(v.area).times(f(areas,v.areaUnit)).times(new Decimal(v.waste).div(100).plus(1)),coverage=v.coverageMode==='packages-per-square'?new Decimal(areas['roofing-square']).div(positive(n('packagesPerSquare'),'Packages per square')):new Decimal(v.packageCoverage).times(f(areas,v.packageCoverageUnit));if(coverage.lte(0))throw Error('Package coverage must be positive.');const packages=order.div(coverage).ceil();if(packages.gt(Number.MAX_SAFE_INTEGER))throw Error('Package count exceeds the supported range.');
  return {metrics:[m('Order area',order.toNumber(),'number','m²'),m('Order square feet',order.div(areas.ft2).toNumber()),m('Roofing squares',order.div(areas['roofing-square']).toNumber()),m('Packages',packages.toNumber()),m('Purchased area',packages.times(coverage).toNumber(),'number','m²'),m('Package cost',packages.times(v.pricePerPackage).toNumber(),'money')],notes:['Enter actual installed package coverage. Three packages per square is an example, not a universal product rule. Starter, ridge and underlayment materials need their own coverage calculations.']};
 }
 if(op==='stairs-layout'){
  const rise=positive(n('totalRise')),count=integer(n('riserCount'),2,200),riser=rise/count,run=positive(n('treadRun')),thickness=n('treadThickness'),floor=n('floorThickness'),flush=v.mount==='flush',offset=flush?run:0,treads=flush?count:count-1,totalRun=run*treads;
  if(thickness>=riser)throw Error('Tread thickness must be below riser height.');
  const opening=v.headroomMode==='required-opening'?offset+(n('targetHeadroom')+floor)*run/riser:n('floorOpening');
  if(v.headroomMode==='from-opening'&&(opening<offset||opening>totalRun))throw Error('Opening edge lies outside the modeled stair flight.');const top=flush?rise:rise-riser;
  return {metrics:[m('Riser height',riser,'number',v.unit),m('Treads',treads),m('Total run',totalRun,'number',v.unit),m('Headroom at opening',opening<=totalRun?(opening-offset)*riser/run-floor:'Opening required beyond modeled flight','number',v.unit),m('Required opening',v.headroomMode==='required-opening'?opening:offset+(n('targetHeadroom')+floor)*run/riser,'number',v.unit),m('Top finished tread height',top,'number',v.unit),m('Top support elevation',top-thickness,'number',v.unit),m('First rough rise',riser-thickness,'number',v.unit)],notes:['Standard mounting places the top tread one riser below the landing. Flush mounting adds one tread at landing height. Headroom is measured vertically over the modeled nose line. This is geometric planning, not a structural cutting plan or building-code compliance check.']};
 }
 if(op==='voltage-impedance'){
  const unit=f({'ohm/m':1,'ohm/km':.001,'milliohm/m':.001,'ohm/ft':1/.3048,'ohm/1000ft':1/304.8,'milliohm/ft':1/304.8},v.coefficientUnit),parallel=integer(n('parallel'),1,1000),voltage=positive(n('voltage')),pf=positive(n('powerFactor'));if(pf>1)throw Error('Power factor cannot exceed one.');const resistance=n('resistance')*unit,reactance=n('reactance')*unit;
  const coefficient=v.system==='dc'||v.impedanceMode==='resistance-only'?resistance:v.impedanceMode==='effective-longitudinal'?n('effective')*unit:resistance*pf+(v.loadType==='leading'?-1:1)*reactance*Math.sqrt(1-pf*pf),drop=(v.system==='ac-three-balanced'?Math.sqrt(3):2)*n('current')*length('length')*coefficient/parallel;if(voltage-drop<=0)throw Error('The entered line/load is outside a meaningful receiving-voltage result for this approximation.');
  return {metrics:[m('Longitudinal coefficient',coefficient,'number','Ω/m'),m('Voltage drop',drop,'number','V'),m('Voltage drop percentage',drop/voltage*100,'percent'),m('Approximate receiving voltage',voltage-drop,'number','V')],notes:['Small-drop steady-load approximation. Three-phase voltage is line-to-line; length is one-way. Parallel conductors are assumed identical with equal current sharing. Negative drop indicates modeled voltage rise. No NEC table or ampacity determination is included.']};
 }
 if(op==='wire-gauge'){
  let area=n('area'),diameter=0;
  if(v.sizeInput==='AWG'){const aught:Record<string,number>={'1/0':0,'2/0':-1,'3/0':-2,'4/0':-3};const gauge=Object.hasOwn(aught,v.awg)?aught[v.awg]:integer(Number(v.awg),0,40);diameter=.127*92**((36-gauge)/39);area=Math.PI*diameter**2/4;}
  if(v.sizeInput==='kcmil')area=positive(n('kcmil'))*1000*Math.PI*.0254**2/4;
  positive(area,'Wire area');if(!diameter)diameter=Math.sqrt(4*area/Math.PI);if(v.calculation==='geometry')return result(m('Equivalent solid diameter',diameter,'number','mm'),m('Cross-sectional area',area,'number','mm²')); 
  const materials:Record<string,[number,number]>={'existing-copper':[1.68e-8,.00393],'existing-aluminum':[2.82e-8,.00403],'silver-nominal':[1.59e-8,.0038],'gold-nominal':[2.44e-8,.0034]},[rho20,alpha]=v.material==='custom'?[n('rho20'),n('alpha')]:materials[v.material];const rho=rho20*(1+alpha*(n('temperature')-20));positive(rho,'Temperature-adjusted resistivity');const loop=2*rho*length('length')/(area*1e-6),drop=loop*n('current'),supply=positive(n('voltage'));if(supply-drop<=0)throw Error('This simple wire model does not yield a positive receiving voltage.');
  return {metrics:[m('Equivalent solid diameter',diameter,'number','mm'),m('Cross-sectional area',area,'number','mm²'),m('Resistivity',rho,'number','Ω·m'),m('Loop resistance',loop,'number','Ω'),m('Voltage drop',drop,'number','V'),m('Receiving voltage',supply-drop,'number','V')],notes:['AWG gives equivalent solid-conductor geometry, not cable outside diameter. Nominal material constants and a linear temperature model are educational estimates, not NEC, manufacturer-resistance or ampacity tables.']};
 }
 throw Error('Unsupported construction mode.');
}
