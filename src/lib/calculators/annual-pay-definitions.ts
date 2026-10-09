import {n,s,type Mode} from './types';
const cash=(key:string,label:string,value=0)=>n(key,label,value,'$',0);
export function annualPayDefinition(federal:Mode):Mode{
  const inherited=structuredClone(federal.fields).filter(f=>!['persons','federalIncomeTaxWithheld','additionalMedicareWithheld','estimatedPayments','verifiedPaymentCredits','stateLocalRate','stateLocalPayments','stateLocalBase','stateLocalEnteredBase'].includes(f.key));
  return {id:'annual-tax-pay',title:'Annual take-home with multiple income sources',algorithm:'annual-tax-pay',fields:[
    inherited.find(f=>f.key==='filing')!,s('employmentType','Earned income type for all three entries',[['employee','Employee wages'],['self','Self-employed business receipts']]),cash('annualIncome','Primary annual income',80000),cash('secondJobIncome','Second annual income source'),cash('thirdJobIncome','Third annual income source'),cash('businessExpenses','Allowed business cash expenses'),cash('federalOnlyDeductions','Verified deductible retirement contributions'),cash('allWageBaseDeductions','Qualified employee deductions reducing federal and both FICA bases'),cash('afterTaxDeductions','After-tax cash deductions'),n('periodsPerYear','Pay periods used for average net cash',26,undefined,1,366),
    ...[n('stateRate','Assumed state tax rate',5,'%',0,100),n('cityRate','Assumed city/local tax rate',0,'%',0,100),s('stateLocalBase','State/local flat-rate planning base',[['cash','Cash income before personal deductions'],['AGI','Federal AGI'],['taxable','Federal taxable income'],['entered','Separately verified tax base']]),cash('stateLocalEnteredBase','Verified state/local planning tax base')].map(f=>({...f,group:'State and city planning assumptions'})),
    ...inherited.filter(f=>f.key!=='filing'),
  ],formula:'Annual net cash = available income − personal cash deductions − federal tax after credits − regular employee FICA − entered state/local estimates.',explanation:'Annual income-tax planning with up to three employee or business receipt sources. Advanced federal deductions and credits use the same documented engine as the federal tax calculator. This estimates annual liability, while the separate W-4 mode estimates payroll withholding. State/city rates are user assumptions, not an automatic state tax return.'};
}
export function expandMarriageMode(mode:Mode){
  for(const suffix of ['A','B'])mode.fields.find(f=>f.key==='filing'+suffix)!.options!.push({value:'qualifyingSurvivingSpouse',label:'Eligible qualifying surviving spouse'});
  for(const suffix of ['A','B','Joint'])mode.fields.push(...[
    n('stateLocalRatePercent'+suffix,`${suffix} combined state/local rate`,0,'%',0,100),s('stateLocalBaseChoice'+suffix,`${suffix} state/local planning base`,[['AGI','Federal AGI'],['entered','Separately entered tax base']]),cash('stateLocalTaxBase'+suffix,`${suffix} verified state/local tax base`),
  ].map(f=>({...f,group:'State and local comparison assumptions'})));
  mode.explanation+=' Optional state/local comparisons use independent flat-rate assumptions for each scenario. Federal tax differences are reported separately; this is not a state tax return or an eligibility recommendation.';
}
