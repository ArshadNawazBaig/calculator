import {taxParameters} from './tax-year';
import {federalComposition,prepareFederalInput} from './tax-composition';
import {num,nonnegative,integer} from './helpers';
import {metric as m,type Values,type Result} from './types';
export function annualPay(v:Values){
  const value=(key:string)=>nonnegative(num(v,key,0),key),gross=value('annualIncome')+value('secondJobIncome')+value('thirdJobIncome'),self=v.employmentType==='self';
  const expenses=self?value('businessExpenses'):0,retirement=value('federalOnlyDeductions'),cafeteria=self?0:value('allWageBaseDeductions'),afterTax=value('afterTaxDeductions');
  if(expenses>gross||(!self&&retirement+cafeteria>gross))throw Error('Business expenses or pretax employee deductions cannot exceed earned income in this nonnegative-income model.');
  const profit=gross-expenses,wages=self?0:gross-retirement-cafeteria,ficaWages=self?0:gross-cafeteria;
  const persons=[{name:'Taxpayer',wages,ssWages:ficaWages,medicareWages:ficaWages,businessProfit:self?profit:0}];
  if(v.filing==='marriedJoint')persons.push({name:'Spouse (no earned income in this scenario)',wages:0,ssWages:0,medicareWages:0,businessProfit:0});
  const input=prepareFederalInput({...v,persons:JSON.stringify(persons)});
  if(self)input.otherAdjustments=value('otherAdjustments')+retirement;
  const federal=federalComposition(input),employeeSS=Math.min(taxParameters(v).socialSecurityWageBase,ficaWages)*.062,employeeMedicare=ficaWages*.0145;
  const cashIncome=profit+value('ordinaryOther')+value('qualifiedDividends')+value('netEligibleLTCG')+value('socialSecurityBenefits');
  const base=v.stateLocalBase==='AGI'?federal.AGI:v.stateLocalBase==='taxable'?federal.taxableIncome:v.stateLocalBase==='entered'?value('stateLocalEnteredBase'):cashIncome;
  const stateRate=value('stateRate'),cityRate=value('cityRate');if(stateRate+cityRate>100)throw Error('Combined state and city planning rates must be at most 100%.');
  const stateTax=base*stateRate/100,cityTax=base*cityRate/100,annualNetCash=cashIncome-retirement-cafeteria-afterTax-federal.netFederalBurden-employeeSS-employeeMedicare-stateTax-cityTax;
  return {annualNetCash,cashIncome,employeeSS,employeeMedicare,stateTax,cityTax,retirement,cafeteria,afterTax,federal};
}
export function runAnnualPay(v:Values):Result{
  const r=annualPay(v),periods=integer(num(v,'periodsPerYear'),1,366),money=(label:string,value:number)=>m(label,value,'money');
  return {metrics:[money('Estimated annual net cash',r.annualNetCash),money('Monthly average',r.annualNetCash/12),money('Average per selected pay period',r.annualNetCash/periods),money('Cash income before personal deductions',r.cashIncome),money('Federal tax after refundable credits',r.federal.netFederalBurden),money('Regular employee Social Security',r.employeeSS),money('Regular employee Medicare',r.employeeMedicare),money('Estimated state tax',r.stateTax),money('Estimated city/local tax',r.cityTax),money('Entered retirement contributions',r.retirement),money('Qualified cafeteria deductions',r.cafeteria),money('After-tax deductions',r.afterTax)],table:{headers:['Federal component','Annual amount ($)'],rows:[['Adjusted gross income',r.federal.AGI],['Taxable income',r.federal.taxableIncome],['Income tax after nonrefundable credits',r.federal.incomeTaxAfterCredits],['Base self-employment tax',r.federal.baseSETax],['Additional Medicare',r.federal.additionalMedicare],['Net investment income tax',r.federal.NIIT],['Refundable credits',r.federal.refundableCredits]]},notes:['Annual planning estimate using the selected federal model, not a W-4 withholding calculation or a payslip. Employer-specific withholding can differ; annual employee Social Security applies one combined wage cap, with any excess withholding reconciled separately.','The selected employment type applies to all three earned-income entries. Joint filing assumes the spouse has no earned income in this scenario. Use the composed federal income mode for separate spouse or mixed employee/self-employed income.','State and city amounts use your flat rates and chosen base; they do not implement a state tax return. Other entered income, dividends, net gains and full Social Security benefits are treated as available cash. Capital gains do not represent gross sale proceeds.','Self-employed retirement deductions must already meet their plan limits; employer and employee SE tax are included once in federal return tax. Do not include these computed contributions again in other adjustments. Negative net cash is reported as a shortfall.']};
}
