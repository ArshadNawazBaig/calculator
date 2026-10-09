import Decimal from 'decimal.js';
import {taxParameters,taxYear} from './tax-year';
import {integer} from './helpers';
import {parseRows} from './row-data';
import {metric as m, type Result, type Values} from './types';
export type AdditionalInput = Record<string, unknown>;
const D = Decimal.clone({precision: 60});
const yes = (value: unknown) => value === true || value === 'yes';
const eligible = (v: AdditionalInput) => v.eligible === undefined || yes(v.eligible);
function amount(v: AdditionalInput, key: string, fallback = 0, signed = false) {
  const value = v[key] ?? fallback;
  if ((typeof value !== 'number' && typeof value !== 'string') || (typeof value === 'string' && !value.trim()) || !Number.isFinite(Number(value)) || (!signed && Number(value) < 0)) throw Error(`${key} must be a finite ${signed ? '' : 'nonnegative '}amount.`);
  return new D(value);
}
function filing(v: AdditionalInput) {
  taxYear(v.taxYear);
  const status = String(v.filing ?? 'single');
  if (!['single','marriedJoint','marriedSeparate','headOfHousehold','qualifyingSurvivingSpouse'].includes(status)) throw Error('Choose a supported filing status.');
  return status;
}
function rows(v: AdditionalInput, key: string): AdditionalInput[] {
  const value = v[key] ?? [];
  if (!Array.isArray(value) || value.length > 100 || value.some(row=>!row || typeof row !== 'object' || Array.isArray(row))) throw Error(`Enter up to 100 valid ${key} records.`);
  return value;
}
const output = (values: Record<string, Decimal | number>) => Object.fromEntries(Object.entries(values).map(([key,value])=>[key,Number(value)]));
const ratio = (magi: Decimal, upper: number, width: number) => D.min(1,D.max(0,new D(upper).minus(magi).div(width)));
export function tips(v: AdditionalInput) {
  const status = filing(v), eligibleEmployeeTips = amount(v,'employeeTips');
  const eligibleBusinessTips = rows(v,'businesses').reduce((sum,business)=>sum.plus(D.min(amount(business,'qualifiedTips'),D.max(0,amount(business,'netIncomeAfterAllocableDeductions',0,true)))),new D(0));
  const cappedBase = eligible(v) && status !== 'marriedSeparate' ? D.min(25000,eligibleEmployeeTips.plus(eligibleBusinessTips)) : new D(0);
  const phaseoutReduction = D.max(0,amount(v,'MAGI',0,true).minus(status==='marriedJoint'?300000:150000)).div(1000).floor().times(100);
  return output({eligibleBusinessTips,eligibleEmployeeTips,cappedBase,phaseoutReduction,deduction:D.max(0,cappedBase.minus(phaseoutReduction))});
}
export function overtime(v: AdditionalInput) {
  const status = filing(v), premium = amount(v,'qualifiedPremium');
  const cappedBase = eligible(v) && status !== 'marriedSeparate' ? D.min(status==='marriedJoint'?25000:12500,premium) : new D(0);
  const phaseoutReduction = D.max(0,amount(v,'MAGI',0,true).minus(status==='marriedJoint'?300000:150000)).div(1000).floor().times(100);
  return output({cappedBase,phaseoutReduction,deduction:D.max(0,cappedBase.minus(phaseoutReduction))});
}
export function carInterest(v: AdditionalInput) {
  const availableInterest = rows(v,'loans').reduce((sum,loan)=>{const total=amount(loan,'qualifiedInterest'),used=amount(loan,'deductedElsewhere');if(used.gt(total))throw Error('Interest deducted elsewhere cannot exceed qualified interest.');return sum.plus(total.minus(used));},new D(0));
  const cappedBase = eligible(v)?D.min(10000,availableInterest):new D(0);
  const phaseoutReduction = D.max(0,amount(v,'MAGI',0,true).minus(filing(v)==='marriedJoint'?200000:100000)).div(1000).ceil().times(200);
  return output({availableInterest,cappedBase,phaseoutReduction,deduction:D.max(0,cappedBase.minus(phaseoutReduction))});
}
export function educationRefundability(v: AdditionalInput) {
  const age=integer(amount(v,'claimantAge',30).toNumber(),0,120),lowEarnings=amount(v,'earnedIncome').lt(amount(v,'support').div(2));
  return {refundEligible:!((age<18||(age===18&&lowEarnings)||(age>18&&age<24&&yes(v.claimantFullTimeStudent)&&lowEarnings))&&yes(v.parentAlive)&&filing(v)!=='marriedJoint')};
}
export function education(v: AdditionalInput) {
  const status=filing(v);let aotc=new D(0),llc=new D(0);const identifiers=new Set<string>();
  for(const student of rows(v,'students')){
    if(student.identifier!==undefined){const id=String(student.identifier).trim().toLowerCase();if(!id||identifiers.has(id))throw Error('Each student must have a unique nonempty label.');identifiers.add(id);}
    const expense=amount(student,'adjustedQualifiedExpenses'),credit=String(student.credit);
    if(!['none','aotc','llc'].includes(credit))throw Error('Choose one education credit per student.');
    if(!eligible(student))continue;
    if(credit==='aotc')aotc=aotc.plus(D.min(2000,expense)).plus(D.min(2000,D.max(0,expense.minus(2000))).times(.25));
    if(credit==='llc')llc=llc.plus(expense);
  }
  const phaseoutRatio=eligible(v)&&status!=='marriedSeparate'?ratio(amount(v,'MAGI',0,true),status==='marriedJoint'?180000:90000,status==='marriedJoint'?20000:10000):new D(0);
  const aotcAfterPhaseout=aotc.times(phaseoutRatio),llcAfterPhaseout=D.min(10000,llc).times(.2).times(phaseoutRatio);
  const refundEligible=v.refundEligible===undefined?educationRefundability(v).refundEligible:yes(v.refundEligible);
  const refundableAotc=refundEligible?aotcAfterPhaseout.times(.4):new D(0),potentialNonrefundable=aotcAfterPhaseout.minus(refundableAotc).plus(llcAfterPhaseout),allowedNonrefundable=D.min(potentialNonrefundable,amount(v,'availableNonrefundableTax',Number.MAX_VALUE));
  return output({phaseoutRatio,aotcBeforePhaseout:aotc,aotcAfterPhaseout,llcAfterPhaseout,refundableAotc,potentialNonrefundable,allowedNonrefundable,totalCredit:allowedNonrefundable.plus(refundableAotc)});
}
export function studentLoanInterest(v: AdditionalInput) {
  const status=filing(v),p=taxParameters(v).studentLoanInterest,bounds=status==='marriedJoint'?p.joint:p.singleHOHQSS,qualified=amount(v,'qualifiedInterest'),cappedInterest=eligible(v)&&status!=='marriedSeparate'&&!yes(v.dependent)?D.min(p.maximum,qualified):new D(0);
  const phaseoutRatio=ratio(amount(v,'MAGI',0,true),bounds[1],bounds[1]-bounds[0]);
  return output({cappedInterest,phaseoutRatio,deduction:cappedInterest.times(phaseoutRatio)});
}
export function traditionalIra(v: AdditionalInput) {
  const status=filing(v),p=taxParameters(v).traditionalIra,age=integer(amount(v,'age',40).toNumber(),0,120),annualContributionLimit=new D(p.contributionLimitUnder50+(age>=50?p.catchUp50Plus:0)),magi=amount(v,'MAGI',0,true);
  const contribution=amount(v,'contribution'),availableContributionCapacity=D.min(amount(v,'compensationAvailable'),D.max(0,annualContributionLimit.minus(amount(v,'otherIraContributions'))));
  let bounds:number[]|undefined;
  if(status==='marriedSeparate'&&!yes(v.livedApartAllYear)&&(yes(v.covered)||yes(v.spouseCovered)))bounds=p.mfsCohabitingEitherCovered;
  else if(yes(v.covered))bounds=['marriedJoint','qualifyingSurvivingSpouse'].includes(status)?p.coveredJointOrQSS:p.coveredSingleHOH;
  else if(status==='marriedJoint'&&yes(v.spouseCovered))bounds=p.uncoveredJointSpouseCovered;
  let phaseoutDeductionLimit=annualContributionLimit;
  if(bounds&&magi.gt(bounds[0]))phaseoutDeductionLimit=magi.gte(bounds[1])?new D(0):D.max(200,annualContributionLimit.times(ratio(magi,bounds[1],bounds[1]-bounds[0])).div(10).ceil().times(10));
  return output({annualContributionLimit,availableContributionCapacity,phaseoutDeductionLimit,deduction:D.min(contribution,availableContributionCapacity,phaseoutDeductionLimit)});
}
export function qbi(v:AdditionalInput){
  const status=filing(v),p=taxParameters(v).qbi,threshold=p.threshold[status as keyof typeof p.threshold],range=status==='marriedJoint'?p.phaseInRangeJoint:p.phaseInRangeOther;
  const taxable=amount(v,'taxableBeforeQbiWithoutSection68'),phaseInFraction=D.min(1,D.max(0,taxable.minus(threshold).div(range))),SSTBApplicableFraction=yes(v.SSTB)?new D(1).minus(phaseInFraction):new D(1);
  const net=amount(v,'adjustedQbiBeforeTips',0,true).minus(amount(v,'deductibleBusinessTips')).minus(amount(v,'priorQbiLoss')),eligibleQBI=D.max(0,net).times(SSTBApplicableFraction),wages=amount(v,'qualifiedBusinessW2Wages').times(SSTBApplicableFraction),property=amount(v,'qualifiedUBIA').times(SSTBApplicableFraction);
  const wagePropertyLimit=D.max(wages.times(.5),wages.times(.25).plus(property.times(.025))),base=eligibleQBI.times(.2),businessComponent=base.minus(phaseInFraction.times(D.max(0,base.minus(wagePropertyLimit))));
  const incomeLimit=D.max(0,taxable.minus(amount(v,'netCapitalGainPlusQualifiedDividends'))).times(.2),normalDeduction=D.min(businessComponent,incomeLimit),active=amount(v,'verifiedActiveQualifiedQbi');
  const minimumDeduction=p.activeMinimumEnabled&&yes(v.materialParticipationConfirmed)&&active.gte(p.activeQBIMinimum??1000)&&SSTBApplicableFraction.gt(0)?p.activeMinimum:0,deduction=D.max(normalDeduction,minimumDeduction);
  return output({threshold,phaseInFraction,SSTBApplicableFraction,eligibleQBI,wagePropertyLimit,businessComponent,incomeLimit,normalDeduction,minimumDeduction,deduction,taxableAfterQbiWithoutSection68:D.max(0,taxable.minus(deduction)),lossCarryforward:D.max(0,net.negated())});
}
export function qbiSection68(v:AdditionalInput){
  const agi=amount(v,'AGI'),itemized=amount(v,'itemizedBeforeSection68'),other=amount(v,'otherBelowAGIDeductions'),status=filing(v);
  const qbiDeduction=qbi({...v,taxableBeforeQbiWithoutSection68:D.max(0,agi.minus(itemized).minus(other)).toNumber()}).deduction;
  const top=['marriedJoint','qualifyingSurvivingSpouse'].includes(status)?768700:status==='marriedSeparate'?384350:640600;
  const itemizedReduction=D.min(itemized,D.max(0,agi.minus(qbiDeduction).minus(other).minus(top))).times(taxParameters(v).itemized.section68Enabled?2:0).div(37),itemizedAfterSection68=itemized.minus(itemizedReduction);
  return output({qbiDeduction,itemizedReduction,itemizedAfterSection68,finalTaxableIncome:D.max(0,agi.minus(itemizedAfterSection68).minus(qbiDeduction).minus(other))});
}
export function eitcContinuousEstimate(v:AdditionalInput){
  const eitcParameters=taxParameters(v).eitc,status=filing(v),children=Math.min(3,integer(amount(v,'children').toNumber(),0,20)),p=eitcParameters.rows[children],joint=status==='marriedJoint',earned=amount(v,'earnedIncome',0,true),agi=amount(v,'AGI',0,true),income=D.max(earned,agi),start=joint?p.jointStart:p.otherStart,end=joint?p.jointEnd:p.otherEnd;
  const phaseInCredit=D.min(p.maxCredit,D.max(0,earned).times(p.creditRate)),phaseoutCapacity=D.max(0,new D(p.maxCredit).minus(D.max(0,income.minus(start)).times(p.phaseoutRate)));
  const age=integer(amount(v,'age',30).toNumber(),0,120),spouseAge=integer(amount(v,'spouseAge',30).toNumber(),0,120),ageEligible=children>0||(age>=25&&age<=64)||(joint&&spouseAge>=25&&spouseAge<=64);
  const qualifies=eligible(v)&&ageEligible&&amount(v,'investmentIncome').lte(eitcParameters.investmentIncomeLimit)&&(status!=='marriedSeparate'||(children>0&&yes(v.separatedSpouseEligibilityConfirmed)))&&income.lt(end);
  return output({phaseInCredit,phaseoutCapacity,estimatedCredit:qualifies?D.min(phaseInCredit,phaseoutCapacity):new D(0)});
}
export const additionalTaxAlgorithms=new Set(['tax-tips-2026','tax-overtime-2026','tax-car-interest-2026','tax-education-2026','tax-student-interest-2026','tax-ira-deduction-2026','tax-qbi-2026','tax-qbi-section68','tax-eitc-estimate-2026']);
export function runAdditionalTax(op:string,v:Values):Result{
  const input:AdditionalInput={...v};for(const key of ['businesses','loans','students'])if(v[key]!==undefined)input[key]=parseRows(v[key],key);
  const values=op==='tax-tips-2026'?tips(input):op==='tax-overtime-2026'?overtime(input):op==='tax-car-interest-2026'?carInterest(input):op==='tax-education-2026'?education(input):op==='tax-student-interest-2026'?studentLoanInterest(input):op==='tax-qbi-2026'?qbi(input):op==='tax-qbi-section68'?qbiSection68(input):op==='tax-eitc-estimate-2026'?eitcContinuousEstimate(input):traditionalIra(input);
  const ratios=['phaseoutRatio','phaseInFraction','SSTBApplicableFraction'];
  return {metrics:Object.entries(values).map(([key,value])=>m(key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase()),ratios.includes(key)?value*100:value,ratios.includes(key)?'percent':'money')),notes:[`${taxYear(v.taxYear)} US federal rules; source review October 9, 2026. Confirm the stated year’s eligibility and reporting requirements. No Social Security numbers, VINs or school identifiers are collected.`,op==='tax-student-interest-2026'||op==='tax-ira-deduction-2026'?'This is an above-AGI deduction. The relevant modified income must follow its own worksheet; IRA and Social Security interactions require the coordinated IRS worksheet.':op==='tax-eitc-estimate-2026'?'This continuous EITC estimate can differ from the IRS income-bin lookup table. Use the final annual IRS worksheet and table for filing. EITC is refundable and is not limited to ordinary income tax.':op.startsWith('tax-qbi')?'QBI reduces taxable income, not AGI, SE tax or payroll taxes. For 2026, the statutory active-business minimum can exceed the ordinary 20%-of-taxable-income cap; final taxable income remains at least zero.':'Schedule 1-A deductions reduce taxable income, not AGI or payroll taxes. Education credits reduce eligible income tax; refundable AOTC is handled separately.']};
}
