import {metric as m,type Values,type Result} from './types';
import {num,integer,dateUTC,dayMs,positive} from './helpers';
import {parseRows,rowNumber} from './row-data';
import {cashflowRoots,payback} from './cashflow-returns';
import {loanLedger} from './loan-ledger';
const money=(label:string,value:number)=>m(label,value,'money');
export const cashflowFinanceAlgorithms=new Set(['dated-irr','dated-roi','growing-payback','regular-irr','rental-holding']);
const rootNotes=['Annual-return roots are searched over log(1+r) from −12 to 8. Multiple detected roots are displayed; a finite search cannot establish that no other roots exist.'];
export function runCashflowFinance(op:string,v:Values):Result{
 const n=(key:string,otherwise?:number)=>num(v,key,otherwise);
 if(op==='dated-irr'){
  const rows=parseRows(v.datedFlows,'Dated cash flows',100).map(row=>({date:String(row.date),ms:dateUTC(String(row.date)).getTime(),amount:rowNumber(row.amount,'Cash flow')})).sort((a,b)=>a.ms-b.ms);if(rows.length<2)throw Error('Enter at least two dated cash flows.');
  const first=rows[0].ms,last=rows.at(-1)!.ms,flows=rows.map(row=>({time:(row.ms-first)/dayMs/365,amount:row.amount})),found=cashflowRoots(flows);
  return {metrics:[m('Solution status',found.status),...found.roots.map((r,i)=>m(found.roots.length===1?'Annual money-weighted return':`Annual return solution ${i+1}`,r*100,'percent')),m('Elapsed days',(last-first)/dayMs)],table:{headers:['Date','Signed cash flow'],rows:rows.map(row=>[row.date,row.amount])},notes:['Uses actual elapsed days divided by 365, including leap-day effects. Same-date cash flows are aggregated when solving.',...rootNotes]};
 }
 if(op==='dated-roi'){
  const days=(dateUTC(v.endDate).getTime()-dateUTC(v.beginningDate).getTime())/dayMs;if(days<=0)throw Error('End date must follow the investment date.');const ratio=n('proceeds')/positive(n('cost'),'Investment cost');
  return {metrics:[m('ROI',(ratio-1)*100,'percent'),m('Annualized return',(ratio**(365/days)-1)*100,'percent'),m('Elapsed days',days)],notes:['An exact-day annualization of the total return with no intermediate cash flows. Include costs and fees in the entered amounts.']};
 }
 if(op==='growing-payback'){
  const count=integer(n('periodCount'),1,1000),flows=[-n('initialInvestment'),...Array.from({length:count},(_,i)=>n('firstAnnualCashflow')*(1+n('annualCashflowGrowthPercent')/100)**i)],discount=n('discountPercent')/100,a=payback(flows),b=payback(flows,discount);
  return {metrics:[m('Simple payback',a??'Not recovered in horizon','number','years'),m('Discounted payback',b??'Not recovered in horizon','number','years')],table:{headers:['Year','Cash flow','Discounted cash flow'],rows:flows.map((flow,i)=>[i,flow,flow/(1+discount)**i])},notes:['Fractional payback linearly interpolates the recovery year. If all cash arrives at year end, actual recovery occurs at that year-end date. Later negative flows can reverse an earlier recovery.']};
 }
 if(op==='regular-irr'){
  const count=integer(n('periodCount'),1,1200),frequency=positive(n('periodsPerYear')),flows=Array(count+1).fill(0) as number[];flows[0]=-n('initialInvestment');for(let i=0;i<count;i++)flows[i+(v.timing==='beginning'?0:1)]+=n('periodicAmount');flows[count]+=n('terminalProceeds');const found=cashflowRoots(flows.map((amount,time)=>({time,amount})));
  return {metrics:[m('Solution status',found.status),...found.roots.flatMap((r,i)=>[m(`Periodic return${found.roots.length>1?` ${i+1}`:''}`,r*100,'percent'),m(`Effective annual return${found.roots.length>1?` ${i+1}`:''}`,Math.expm1(Math.log1p(r)*frequency)*100,'percent')])],table:{headers:['Period','Signed cash flow'],rows:flows.map((flow,i)=>[i,flow])},notes:['Recurring cash flows are signed from the investor perspective. Annual return compounds the solved periodic return.',...rootNotes]};
 }
 if(op==='rental-holding'){
  const years=integer(n('holdingYears'),1,100),price=positive(n('purchasePrice')),principal=price*(1-n('downPercent')/100),initial=price-principal+n('closingCosts')+n('repairCosts'),loan=loanLedger(principal,n('nominalAprPercent'),integer(n('loanMonths'),1,1200)),expenses=parseRows(v.expenseLines,'Expense lines').map(row=>({amount:rowNumber(row.annualAmount,'Annual expense',0),growth:rowNumber(row.growthPercent,'Expense growth',-100,100)/100})),flows=[-initial];
  const rows:(string|number)[][]=[];let firstNoi=0,firstCash=0,firstIncome=0,firstManagement=0,firstDebt=0;
  for(let year=1;year<=years;year++){
   const rent=12*n('monthlyRent')*(1+n('rentGrowthPercent')/100)**(year-1)*(1-n('vacancyPercent')/100),other=12*n('otherMonthlyIncome')*(1+n('otherIncomeGrowthPercent')/100)**(year-1),management=(rent+other)*n('managementPercent')/100,expense=expenses.reduce((sum,e)=>sum+e.amount*(1+e.growth)**(year-1),0),noi=rent+other-management-expense,debt=loan.rows.slice((year-1)*12,year*12).reduce((sum,row)=>sum+row.regularPayment,0),cash=noi-debt;
   flows.push(cash);rows.push([year,rent,other,management,expense,noi,debt,cash]);if(year===1){firstNoi=noi;firstCash=cash;firstIncome=rent+other;firstManagement=management;firstDebt=debt;}
  }
  const remaining=years*12>=loan.rows.length?0:loan.rows[years*12-1].endingBalance,sale=v.salePriceMode==='known-price'?n('salePrice'):(n('afterRepairValue')||price)*(1+n('appreciationPercent')/100)**years,exit=sale*(1-n('saleCostPercent')/100)-remaining;flows[years]+=exit;
  const profit=flows.reduce((a,b)=>a+b,0),roots=cashflowRoots(flows.map((amount,time)=>({time,amount})));
  return {metrics:[money('Initial cash',initial),money('First-year effective income',firstIncome),money('First-year management fee',firstManagement),money('First-year NOI',firstNoi),money('First-year debt service',firstDebt),money('First-year cash flow',firstCash),m('First-year cap rate',firstNoi/price*100,'percent'),m('First-year cash-on-cash return',initial?firstCash/initial*100:'Undefined: zero initial cash',initial?'percent':'number'),money('Sale price',sale),money('Remaining debt at sale',remaining),money('Net sale proceeds',exit),money('Total profit',profit),m('Total ROI',initial?profit/initial*100:'Undefined: zero initial cash',initial?'percent':'number'),m('IRR solution status',roots.status),...roots.roots.map((r,i)=>m(roots.roots.length===1?'Annual IRR':`Annual IRR ${i+1}`,r*100,'percent'))],table:{headers:['Year','Collected rent','Other income','Management','Other expenses','NOI','Debt service','Operating cash flow'],rows},notes:[`Initial cash flow: ${-initial}. Final-year sale equity of ${exit.toFixed(2)} is added once to operating cash flow. Income/capital-gains tax, depreciation deductions and transaction timing within the year are excluded.`,...rootNotes]};
 }
 throw Error('Unsupported cash-flow mode.');
}
