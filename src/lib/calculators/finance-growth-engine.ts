import {metric as m,type Values,type Result} from './types';
import {num,integer,positive,nonnegative} from './helpers';
import {exponentialRoots,presentAnnuity,futureAnnuity} from './financial-roots';

export const growthFinanceAlgorithms=new Set(['nominal-tvm','dual-contributions','fund-loads','fund-exit-load','vehicle-price','lease-price']);
const money=(label:string,value:number)=>m(label,value,'money');
export function nominalLogGrowth(rate:number,frequency:string,perYear:number){const j=rate/100;if(frequency==='continuous')return j/perYear;const c=positive(Number(frequency),'Compounds per year');if(1+j/c<=0)throw Error('Nominal rate must leave a positive compounding factor.');return c/perYear*Math.log1p(j/c);}
export function runGrowthFinance(op:string,v:Values):Result{
 const n=(key:string,fallback?:number)=>num(v,key,fallback),yes=(key:string)=>['yes','true'].includes(v[key]);
 if(op==='nominal-tvm'){
  const py=positive(n('paymentsPerYear'),'Payments per year'),begin=v.timing==='beginning';let pv=n('pv'),fv=n('fv'),payment=n('payment'),periods=n('periods'),rate=n('nominalRatePercent');
  let log=nominalLogGrowth(rate,v.compoundsPerYear,py),i=Math.expm1(log);
  if(v.solve==='nominalRatePercent'){
   if(pv===0&&fv===0&&payment===0)throw Error('All cash flows are zero; the rate is indeterminate.');if(![pv,fv,payment].some(x=>x>0)||![pv,fv,payment].some(x=>x<0))throw Error('Rate solving requires both positive and negative cash flows.');
   const terms=begin?[{time:-(periods+1),amount:pv+payment},{time:-periods,amount:-pv},{time:-1,amount:fv-payment},{time:0,amount:-fv}]:[{time:-(periods+1),amount:pv},{time:-periods,amount:payment-pv},{time:-1,amount:fv},{time:0,amount:-fv-payment}];
   const roots=exponentialRoots(terms).filter(x=>Math.abs(x)>1e-8||Math.abs(pv+payment*periods+fv)<=1e-10*Math.max(1,Math.abs(pv),Math.abs(payment*periods),Math.abs(fv)));

   if(roots.length!==1)throw Error(roots.length?'Multiple admissible rates were found. Cash flows do not determine one answer.':'No rate found in the supported periodic search range. Check cash-flow signs and timing.');
   log=roots[0];i=Math.expm1(log);rate=v.compoundsPerYear==='continuous'?log*py*100:Number(v.compoundsPerYear)*Math.expm1(log*py/Number(v.compoundsPerYear))*100;
  }
  const timing=begin?1+i:1,growth=Math.exp(periods*log),annuity=futureAnnuity(i,periods)*timing;
  if(v.solve==='fv')fv=-(pv*growth+payment*annuity);
  if(v.solve==='pv')pv=log>=0?-(fv*Math.exp(-periods*log)+payment*presentAnnuity(i,periods)*timing):-(fv+payment*annuity)/growth;
  if(v.solve==='payment')payment=log>=0?-(pv+fv*Math.exp(-periods*log))/positive(presentAnnuity(i,periods)*timing,'Discounted annuity factor'):-(fv+pv*growth)/positive(annuity,'Annuity factor');
  if(v.solve==='periods'){
   if(i===0){if(payment===0)throw Error(pv+fv===0?'Duration is indeterminate.':'No duration satisfies these cash flows.');periods=-(pv+fv)/payment;}
   else{const q=payment*timing/i,denominator=pv+q;if(denominator===0)throw Error('These cash flows do not identify a unique duration.');const ratio=(q-fv)/denominator;if(ratio<=0)throw Error('No positive real duration satisfies these cash flows.');periods=Math.log(ratio)/log;}
  }
  if(!Number.isFinite(periods)||periods<=0||periods>12000)throw Error('Use a positive duration no greater than 12,000 payment periods.');
  const names:Record<string,string>={pv:'Present cash flow',fv:'Future cash flow',payment:'Payment cash flow',nominalRatePercent:'Nominal annual rate',periods:'Payment periods'},values={pv,fv,payment,nominalRatePercent:rate,periods};
  return {metrics:[m(names[v.solve],values[v.solve as keyof typeof values],['pv','fv','payment'].includes(v.solve)?'money':v.solve==='nominalRatePercent'?'percent':'number'),m('Periodic rate',i*100,'percent'),m('Effective annual rate',Math.expm1(log*py)*100,'percent'),m('Equivalent years',periods/py)],notes:['Use consistent signs: payments negative, receipts positive. Fractional periods are an analytic equivalent duration. Rate inversion searches periodic log-growth from −12 to 8 and rejects multiple detected roots; roots beyond that range are not assessed.']};
 }
 if(op==='dual-contributions'){
  const months=integer(n('months'),1,1200),initial=nonnegative(n('initial')),monthly=nonnegative(n('monthlyContribution')),annual=nonnegative(n('annualContribution')),ag=1+n('annualContributionGrowthPercent',0)/100,mg=1+n('monthlyContributionGrowthPercent',0)/100,log=nominalLogGrowth(n('nominalRatePercent'),v.compoundsPerYear,12),inflation=n('inflationPercent',0)/100,taxRate=n('taxRatePercent',0)/100;
  if(ag<0||mg<0||inflation<=-1||taxRate<0||taxRate>1)throw Error('Check contribution growth, inflation, and tax assumptions.');
  let balance=initial,contributions=0,gross=0,taxes=0,yearInterest=0;const rows:(string|number)[][]=[];
  const deposit=(month:number)=>{const year=Math.floor(month/12),amount=monthly*mg**year+(month%12===0?annual*ag**year:0);balance+=amount;contributions+=amount;};
  for(let month=1;month<=months;month++){
   if(v.timing==='beginning')deposit(month-1);
   const interest=balance*Math.expm1(log);balance+=interest;gross+=interest;yearInterest+=interest;
   if(v.timing!=='beginning'){const y=Math.floor((month-1)/12),amount=monthly*mg**y+(month%12===0?annual*ag**y:0);balance+=amount;contributions+=amount;}
   if(month%12===0||month===months){const tax=Math.max(0,yearInterest)*taxRate;balance-=tax;taxes+=tax;rows.push([month/12,contributions,yearInterest,tax,balance]);yearInterest=0;}
  }
  return {metrics:[money('Ending balance',balance),money('Contributions after opening balance',contributions),money('Gross interest',gross),money('Tax paid',taxes),money('Net investment gain',balance-initial-contributions),money('Inflation-adjusted balance',balance/(1+inflation)**(months/12))],table:{headers:['Year','Cumulative contributions','Period interest','Period tax','Balance'],rows},notes:['Tax is modeled on positive net interest at each year end and the final partial year. The two contribution streams increase independently once per year.']};
 }
 if(op==='fund-exit-load'){
  const net=nonnegative(n('netInvestedLot')),redemption=nonnegative(n('redemptionBeforeLoad')),fee=(v.deferredLoadBasis==='redemption-value'?redemption:Math.min(net,redemption))*n('deferredLoadPercent')/100;
  return {metrics:[money('Exit load',fee),money('Ending after all fees',redemption-fee)]};
 }
 if(op==='fund-loads'){
  const months=integer(n('months'),1,1200),front=n('frontLoadPercent')/100,expense=n('expenseRatioPercent')/100,deferred=n('deferredLoadPercent')/100,returnRate=n('grossAnnualReturnPercent')/100;
  if(returnRate<=-1||front<0||front>1||expense<0||expense>=1||deferred<0||deferred>1)throw Error('Check return and percentage fee ranges.');
  const lots:{basis:number;value:number;feeMonths:number}[]=[];let frontLoads=0,operating=0,noFee=0,cash=0;
  const deposit=(amount:number)=>{nonnegative(amount);cash+=amount;noFee+=amount;frontLoads+=amount*front;lots.push({basis:amount*(1-front),value:amount*(1-front),feeMonths:0});};deposit(n('initial'));
  const growth=Math.exp(Math.log1p(returnRate)/12),annual=n('annualContribution'),monthly=n('monthlyContribution');
  for(let month=1;month<=months;month++){
   if(v.timing==='beginning')deposit(monthly+((month-1)%12===0?annual:0));
   noFee*=growth;for(const lot of lots){lot.value*=growth;lot.feeMonths++;}
   // Expense is settled before end-of-period contributions, so a new deposit is not charged for time before it was invested.
   if(month%12===0||month===months){for(const lot of lots){const fee=lot.value*(1-(1-expense)**(lot.feeMonths/12));operating+=fee;lot.value-=fee;lot.feeMonths=0;}}
   if(v.timing!=='beginning')deposit(monthly+(month%12===0?annual:0));
  }
  const before=lots.reduce((sum,lot)=>sum+lot.value,0),exit=lots.reduce((sum,lot)=>sum+(v.deferredLoadBasis==='redemption-value'?lot.value:Math.min(lot.basis,lot.value))*deferred,0),after=before-exit;
  return {metrics:[money('Gross cash supplied',cash),money('Front loads',frontLoads),money('Operating expenses',operating),money('Ending before exit load',before),money('Exit load',exit),money('Ending after all fees',after),money('Direct fees',frontLoads+operating+exit),money('No-fee ending balance',noFee),money('Total fee impact',noFee-after)],notes:['Generic model: gross return compounds monthly; operating expense is settled at annual boundaries and the final partial year. Actual fund expenses accrue differently. Published returns often already include operating expenses. Deferred loads depend on the prospectus.']};
 }
 if(op==='lease-price'){
  const months=integer(n('months'),1,1200),residual=nonnegative(n('residual')),factor=nonnegative(n('moneyFactor')),tax=n('salesTaxPercent')/100,preTax=n('payment')/(1+tax),cap=(preTax+residual/months-residual*factor)/(1/months+factor),price=cap+n('down')+n('trade');if(cap<0||price<0)throw Error('Payment does not support a nonnegative vehicle price.');
  return {metrics:[money('Selling price',price),money('Adjusted capitalized cost',cap),money('Pre-tax payment',preTax)],notes:['Assumes tax on the monthly payment. Money-factor rent charges are a pricing convention, not an effective loan APR.']};
 }
 if(op==='vehicle-price'){
  const months=integer(n('months'),1,1200),r=n('nominalAprPercent')/1200,trade=n('trade'),debt=n('tradeDebt'),rebate=n('rebate'),fees=n('fees'),tax=n('salesTaxPercent')/100,percent=v.downType==='percent',down=n('down'),financed=yes('financeTaxAndFees');
  if(percent&&down>=100)throw Error('For financed pricing, percentage down payment must be below 100%.');
  const downFor=(price:number)=>percent?price*down/100:down,taxFor=(price:number)=>tax*Math.max(0,price-(yes('tradeTaxCredit')?trade:0)-(yes('rebateTaxCredit')?rebate:0)),principalFor=(price:number)=>price-downFor(price)-trade+debt-rebate+(financed?taxFor(price)+fees:0);
  let price=n('price');if(v.solve==='price'){const target=n('payment')*presentAnnuity(r,months);if(principalFor(0)>target)throw Error('The budget does not cover the entered debt and fees.');let low=0,high=Math.max(1,target+down+trade+rebate);while(principalFor(high)<target&&high<1e16)high*=2;for(let j=0;j<100;j++){const mid=(low+high)/2;if(principalFor(mid)<target)low=mid;else high=mid;}price=(low+high)/2;}
  const principal=nonnegative(principalFor(price),'Financed principal'),payment=principal/presentAnnuity(r,months),salesTax=taxFor(price),upfront=downFor(price)+(financed?0:salesTax+fees);
  return {metrics:[money('Selling price',price),money('Financed principal',principal),money('Monthly payment',payment),money('Sales tax',salesTax),money('Upfront cash',upfront),money('Total interest',payment*months-principal)],notes:['Tax credits are entered policy assumptions. Actual state rules, fee treatment, and lender terms can differ. Trade debt adds to the financing requirement.']};
 }
 throw Error('Unsupported investment or pricing mode.');
}
