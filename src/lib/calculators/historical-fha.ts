import Decimal from 'decimal.js';
import {dateUTC, integer, num} from './helpers';
import {rowNumber} from './row-data';
import {metric as m, n, s, t, mode, type Values, type Result} from './types';
type Inputs=Record<string,unknown>;
const yes=(value:unknown)=>value===true||value==='yes';
const amount=(v:Inputs,key:string)=>rowNumber(v[key]??0,key,0);
export function historicalFhaNormalization(v:Inputs){
  const base=amount(v,'baseLoan'),price=amount(v,'originalPrice'),appraisal=amount(v,'originalAppraisal');
  if(Math.min(base,price,appraisal)<=0)throw Error('Original base loan, sale price and appraisal must be positive.');
  const originalValue=Math.min(price,appraisal),factor=new Decimal(base).plus(amount(v,'financedUpfrontAmount')).div(base),threshold=new Decimal(originalValue).times('.78'),balance=new Decimal(amount(v,'noteBalance'));
  return {originalValue,noteToBaseFactor:factor.toNumber(),baseEquivalentBalance:balance.div(factor).toNumber(),baseThreshold:threshold.toNumber(),noteThreshold:threshold.times(factor).toNumber(),atOrBelow78:balance.lte(threshold.times(factor))};
}
export function historicalFhaRegime(v:Inputs):{regime:string;minimumMipMonths:number|null}{
  const closing=dateUTC(String(v.closingDate)),assigned=dateUTC(String(v.caseAssignedDate)),term=integer(amount(v,'termMonths'),1,600);
  if(assigned>closing)throw Error('The FHA case assignment cannot follow closing.');
  if(!yes(v.verifiedEligibleMMI))return {regime:'eligibility-unverified',minimumMipMonths:null};
  if(assigned>=dateUTC('2013-06-03'))return {regime:'modern-duration',minimumMipMonths:null};
  if(closing<dateUTC('2001-01-01'))return {regime:'outside-historical-cancellation',minimumMipMonths:null};
  if(term>180)return {regime:'historical-78',minimumMipMonths:60};
  const {originalValue}=historicalFhaNormalization(v),base=new Decimal(amount(v,'baseLoan'));
  const charged=assigned<dateUTC('2008-07-14')?base.gte(new Decimal(originalValue).times('.9')):assigned<dateUTC('2011-04-18')?base.gt(new Decimal(originalValue).times('.9')):base.gt(new Decimal(originalValue).times('.78'));
  return {regime:charged?'historical-78':'no-annual-mip',minimumMipMonths:0};
}
export function historicalFhaRequest(v:Inputs){
  const regime=historicalFhaRegime(v),normalization=historicalFhaNormalization(v),paid=integer(amount(v,'paidMipMonths'),0,1200);
  const eligibleToRequest=regime.regime==='historical-78'&&normalization.atOrBelow78&&paid>=regime.minimumMipMonths!&&!yes(v.over30DaysLateInPast12Months);
  return {...regime,...normalization,eligibleToRequest,cancellationProcessed:eligibleToRequest&&yes(v.servicerCancellationConfirmed)};
}
export function historicalFhaProjection(v:Inputs,balances:{month:number;ending:number}[]){
  const regime=historicalFhaRegime(v),normalized=historicalFhaNormalization(v);
  if(regime.regime==='no-annual-mip')return 0;
  if(regime.regime!=='historical-78')throw Error('This scenario requires an eligible historical forward MMI loan. Modern loans use the current-duration or verified manual policy.');
  const atStart=amount(v,'baseLoan')+amount(v,'financedUpfrontAmount')<=normalized.noteThreshold;
  const crossing=atStart?0:balances.find(row=>row.ending<=normalized.noteThreshold+1e-8)?.month;
  return crossing===undefined?null:Math.max(regime.minimumMipMonths!,crossing);
}
export const historicalFhaMode=()=>mode('historical-mip-78','Historical FHA 78% cancellation check','fha-historical-78',[
  s('verifiedEligibleMMI','Verified eligible FHA forward MMI program',[['no','Not yet verified'],['yes','Yes']]),t('closingDate','Original closing date','2012-03-20','date'),t('caseAssignedDate','FHA case assignment date','2012-02-17','date'),n('termMonths','Original loan term',360,'months',1,600),n('baseLoan','Original base loan excluding financed upfront premium',96500,'$',.01),n('originalPrice','Original sale price',100000,'$',.01),n('originalAppraisal','Original appraisal',100000,'$',.01),n('financedUpfrontAmount','Actual financed upfront premium',1688.75,'$',0),n('noteBalance','Current note balance including remaining financed premium',79365,'$',0),n('paidMipMonths','Months of MIP already paid',60,'months',0,1200),s('over30DaysLateInPast12Months','More than 30 days delinquent in the previous 12 months',[['no','No'],['yes','Yes']]),s('servicerCancellationConfirmed','Has the servicer confirmed cancellation processing?',[['no','No'],['yes','Yes']]),
],'Base-equivalent balance = note balance ÷ (1 + actual financed upfront premium ÷ original base loan). Compare with 78% of the lower original price/appraisal.','Checks historical program dates, short-term origination-LTV exceptions and the five-year minimum for longer loans. A threshold crossing permits a request only within the stated scope; it does not itself stop billing. The proportional premium normalization is an inference corroborated by HUD’s published Case Query example.');
export function runHistoricalFha(v:Values):Result{
  const r=historicalFhaRequest(v);
  return {metrics:[m('Historical rule',r.regime.replaceAll('-',' ')),m('Meets modeled request conditions',r.eligibleToRequest?'Yes':'No'),m('Cancellation processing confirmed',r.cancellationProcessed?'Yes':'No'),m('Original value',r.originalValue,'money'),m('Base-equivalent balance',r.baseEquivalentBalance,'money'),m('78% base threshold',r.baseThreshold,'money'),m('Equivalent note threshold',r.noteThreshold,'money'),m('Minimum MIP months',r.minimumMipMonths??'Not applicable'),m('MIP months entered',num(v,'paidMipMonths'))],notes:['Applies to verified eligible forward MMI mortgages closed on or after January 1, 2001, with a case assigned before June 3, 2013. Cases assigned from that date follow different duration rules.','Use original purchase value, not a new appraisal. Scheduled cancellation follows original amortization; extra principal may support an earlier request requiring lender/HUD processing and payment-history checks. Obtain the final chargeable month from the servicer.','Normalization uses only the actually financed portion of upfront MIP. It does not subtract the original full premium from today’s balance. The source example confirms the proportional calculation, but loan-specific servicing records control.']};
}
