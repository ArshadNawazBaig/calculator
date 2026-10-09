import {num,integer,positive} from './helpers';
import {normalCdf,normalSf,inverseNormalSf} from './normal';
import {metric as m,type Values,type Result} from './types';
const metrics=(p:number,q:number)=>({A:p,B:q,notA:1-p,notB:1-q,intersection:p*q,union:p+(1-p)*q,xor:p*(1-q)+(1-p)*q,neither:(1-p)*(1-q)});
const close=(a:number,b:number)=>Math.abs(a-b)<=64*Number.EPSILON*Math.max(Math.abs(a),Math.abs(b),1e-300);
const unknown=():Result=>({metrics:[m('Solution','The inputs do not determine unique probabilities')],notes:['The constraints are redundant. Supply a different independent quantity.']});
export function probabilitySolver(v:Values):Result{
  if(v.known1===v.known2)throw Error('Choose two different known quantities.');
  const a=num(v,'value1'),b=num(v,'value2');
  if(a<0||a>1||b<0||b>1)throw Error('Probabilities must be between zero and one.');
  const original=[[v.known1,a],[v.known2,b]] as [string,number][];
  const constraints=original.map(([k,x])=>[k==='notA'?'A':k==='notB'?'B':k,k==='notA'||k==='notB'?1-x:x] as [string,number]);
  const known=Object.fromEntries(constraints);
  if(constraints[0][0]===constraints[1][0]){if(close(constraints[0][1],constraints[1][1]))return unknown();throw Error('The supplied probabilities are inconsistent.');}
  let candidates:[number,number][]=[];
  if(known.A!==undefined||known.B!==undefined){
    const swap=known.A===undefined,p=swap?known.B:known.A;
    const [k,x]=constraints.find(([key])=>key!==(swap?'B':'A'))!;
    let numerator:number,denominator:number;
    if(k==='A'||k==='B'){numerator=x;denominator=1;}
    else if(k==='intersection'){numerator=x;denominator=p;}
    else if(k==='union'){numerator=x-p;denominator=1-p;}
    else if(k==='xor'){numerator=x-p;denominator=1-2*p;}
    else {numerator=1-p-x;denominator=1-p;}
    if(denominator===0){if(numerator===0)return unknown();throw Error('The supplied probabilities are inconsistent.');}
    const q=numerator/denominator;candidates=[swap?[q,p]:[p,q]];
  }else{
    let product:number,sum:number;
    if(known.union!==undefined&&known.neither!==undefined){
      if(!close(known.union+known.neither,1))throw Error('Union and neither must add to one.');
      if(known.union===0)candidates=[[0,0]];else return unknown();
    }else{
      if(known.intersection!==undefined){product=known.intersection;sum=known.union!==undefined?product+known.union:known.xor!==undefined?known.xor+2*product:1+product-known.neither;}
      else if(known.union!==undefined){product=known.union-known.xor;sum=2*known.union-known.xor;}
      else {product=1-known.xor-known.neither;sum=2-known.xor-2*known.neither;}
      let disc=sum*sum-4*product;
      if(disc<0&&Math.abs(disc)<=32*Number.EPSILON*Math.max(sum*sum,Math.abs(4*product)))disc=0;
      if(disc<0)throw Error('The probabilities do not describe two independent events.');
      const large=(sum+Math.sqrt(disc))/2,small=large===0?0:product/large;
      candidates=[[small,large]];if(!close(small,large))candidates.push([large,small]);
    }
  }
  candidates=candidates.filter(([p,q])=>Number.isFinite(p)&&Number.isFinite(q)&&p>=0&&p<=1&&q>=0&&q<=1&&original.every(([key,x])=>close(metrics(p,q)[key as keyof ReturnType<typeof metrics>],x)));
  if(!candidates.length)throw Error('The supplied probabilities are inconsistent with independent events.');
  const headers=['Solution','P(A)','P(B)','P(not A)','P(not B)','P(A and B)','P(A or B)','P(exactly one)','P(neither)'];
  return {metrics:[m('Valid labeled solutions',candidates.length),...candidates.flatMap(([p,q],i)=>[m(`Solution ${i+1}: P(A)`,p),m(`Solution ${i+1}: P(B)`,q)])],table:{headers,rows:candidates.map(([p,q],i)=>[i+1,...Object.values(metrics(p,q))])},notes:['All calculations assume independence. Swapping A and B can give a second labeled solution when only aggregate quantities are known.']};
}

export function probabilitySeries(v:Values):Result{
  const p=num(v,'pA'),q=num(v,'pB'),a=integer(num(v,'nA'),1,Number.MAX_SAFE_INTEGER),b=integer(num(v,'nB'),1,Number.MAX_SAFE_INTEGER);
  const group=(p:number,n:number)=>({all:p**n,none:p===1?0:Math.exp(n*Math.log1p(-p)),one:p===1?1:-Math.expm1(n*Math.log1p(-p))});
  const x=group(p,a),y=group(q,b);
  return {metrics:[m('All A trials',x.all),m('No A trials',x.none),m('At least one A',x.one),m('All B trials',y.all),m('No B trials',y.none),m('At least one B',y.one),m('All A and all B',x.all*y.all),m('No A and no B',x.none*y.none),m('At least one A and at least one B',x.one*y.one),m('All A and no B',x.all*y.none),m('All B and no A',y.all*x.none),m('At least one A and no B',x.one*y.none),m('At least one B and no A',y.one*x.none)]};
}

export function normalInterval(v:Values):Result{
  const bound=(text:string)=>{if(/^\+?(inf|infinity|∞)$/i.test(text.trim()))return Infinity;if(/^-(inf|infinity|∞)$/i.test(text.trim()))return -Infinity;const value=Number(text);if(!text.trim()||!Number.isFinite(value))throw Error('Use a finite bound or inf / -inf.');return value;};
  const mean=num(v,'mean'),sd=positive(num(v,'sd'),'Standard deviation'),lower=bound(v.lower),upper=bound(v.upper);
  if(lower>upper)throw Error('Lower bound cannot exceed upper bound.');
  const zl=(lower-mean)/sd,zu=(upper-mean)/sd,between=zl>=0?normalSf(zl)-normalSf(zu):normalCdf(zu)-normalCdf(zl);
  const coverages=[.6826894921370859,.8,.9,.95,.98,.99,.995,.998,.999,.9999,.99999];
  return {metrics:[m('Probability between',between),m('Probability outside',normalCdf(zl)+normalSf(zu)),m('Probability below lower bound',normalCdf(zl)),m('Probability above upper bound',normalSf(zu))],table:{headers:['Central coverage %','Lower value','Upper value'],rows:coverages.map(c=>{const z=inverseNormalSf((1-c)/2);return [c*100,mean-z*sd,mean+z*sd];})},notes:['These intervals describe central distribution coverage. They are not confidence intervals for an estimated mean.']};
}
