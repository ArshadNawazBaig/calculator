export const lengths:Record<string,number>={mm:.001,cm:.01,m:1,km:1000,in:.0254,ft:.3048,yd:.9144,mi:1609.344};
export const areas:Record<string,number>={mm2:.000001,cm2:.0001,m2:1,ft2:.09290304,yd2:.83612736,acre:4046.8564224,hectare:10000,'roofing-square':9.290304};
export const volumes:Record<string,number>={m3:1,ft3:.028316846592,yd3:.764554857984};
export const powerUnits:Record<string,number>={W:1,kW:1000,'hp-mechanical':745.6998715822702,'hp-metric':735.49875,'hp-electric':746,'hp-boiler-NIST':9809.5,'BTU-IT/h':.2930710701722222};
export const masses:Record<string,number>={t:1e6,kg:1000,g:1,mg:.001,ug:.000001,Da:1.66053906892e-24,lb:453.59237,oz:28.349523125};
export const liters:Record<string,number>={m3:1000,cm3:.001,mm3:.000001,L:1,mL:.001,'US-gal':3.785411784,'US-qt':.946352946,'US-pt':.473176473,'US-cup':.2365882365,'US-fl-oz':.0295735295625,yd3:764.554857984,ft3:28.316846592,in3:.016387064};
export const molarUnits:Record<string,number>={M:1,mM:.001,uM:.000001,nM:1e-9,'mol/m3':.001};
export const massConcentrations:Record<string,number>={'kg/L':1000,'g/L':1,'mg/L':.001,'kg/m3':1,'g/m3':.001};
export const dataBits:Record<string,string>={b:'1',kb:'1000',Mb:'1000000',Gb:'1000000000',Tb:'1000000000000',B:'8',kB:'8000',MB:'8000000',GB:'8000000000',TB:'8000000000000',KiB:'8192',MiB:'8388608',GiB:'8589934592',TiB:'8796093022208'};
export const rateBits:Record<string,string>={'bit/s':'1','kbit/s':'1000','Mbit/s':'1000000','Gbit/s':'1000000000','Tbit/s':'1000000000000','B/s':'8','kB/s':'8000','MB/s':'8000000'};
export function unitFactor(table:Record<string,number>,unit:string){if(!Object.hasOwn(table,unit))throw Error('Select a supported unit.');return table[unit];}
