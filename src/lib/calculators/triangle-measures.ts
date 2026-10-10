import {numericTextMetric as textMetric,metric as m,type Metric} from './types';
export function triangleMeasures(a:number,b:number,c:number,area:number):Metric[]{
  const scale=Math.max(a,b,c),an=a/scale,bn=b/scale,cn=c/scale,k=(area/scale)/scale,p=an+bn+cn;
  const x=(bn*bn+cn*cn-an*an)/(2*cn),y=2*k/cn;
  const coordinate=(x:number,y:number)=>Number.isFinite(x)&&Number.isFinite(y)?`(${Number(x.toPrecision(12))}, ${Number(y.toPrecision(12))})`:'Outside supported coordinate precision';
  const value=(label:string,number:number)=>m(label,Number.isFinite(number)?number:'Outside supported numerical precision');
  return [
    value('Semiperimeter',scale*p/2),value('Altitude to a',scale*2*k/an),value('Altitude to b',scale*2*k/bn),value('Altitude to c',scale*2*k/cn),
    value('Median from A',scale*Math.hypot((cn+x)/2,y/2)),value('Median from B',scale*Math.hypot(x/2-cn,y/2)),value('Median from C',scale*Math.hypot(x-cn/2,y)),
    value('Inradius',scale*2*k/p),value('Circumradius',scale*an*bn*cn/(4*k)),
    textMetric('Vertex A','(0, 0)'),textMetric('Vertex B',coordinate(c,0)),textMetric('Vertex C',coordinate(scale*x,scale*y)),
    textMetric('Centroid',coordinate(scale*(cn+x)/3,scale*y/3)),textMetric('Incenter',coordinate(scale*cn*(bn+x)/p,scale*cn*y/p)),
    textMetric('Circumcenter',coordinate(c/2,scale*(bn*bn-cn*x)/(2*y))),
  ];
}
