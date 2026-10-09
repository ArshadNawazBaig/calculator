import {describe, expect, it} from 'vitest';
import * as additional from '@/lib/calculators/tax-additional';
import * as composition from '@/lib/calculators/tax-composition';
import {gainTax} from '@/lib/calculators/tax-modules';
import {taxYear} from '@/lib/calculators/tax-year';
import {additionalChildCredit,adjustedChildCreditPayroll} from '@/lib/calculators/child-credit';
import {annualPay} from '@/lib/calculators/annual-pay';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults, type Mode, type Result, type Values} from '@/lib/calculators/types';
import references from './fixtures/tax-years-reference.json';
import actcReferences from './fixtures/tax-years-actc-reference.json';

type Fixture = {id:string;target:string;inputs:Record<string,unknown>;expected:Record<string,number>;absoluteTolerance:number};
const helpers:Record<string,(v:Record<string,unknown>)=>unknown>={
  tips:additional.tips, overtime:additional.overtime, carInterest:additional.carInterest,
  studentLoanInterest:additional.studentLoanInterest, traditionalIra:additional.traditionalIra,
  qbi:additional.qbi, eitcContinuousEstimate:additional.eitcContinuousEstimate,
  federalComposition:composition.federalComposition, expandedStandard:composition.expandedStandard,
  itemizedDeduction:composition.itemizedDeduction, careCredit:composition.careCredit,
  gainTax:v=>gainTax(Number(v.ordinary),Number(v.gain),v.filing as Parameters<typeof gainTax>[2],Number(v.taxYear)),
  seniorDeduction:v=>({value:composition.seniorDeduction(v)}),
};
function compare(actual:unknown,expected:Record<string,number>,tolerance=1e-8){
  for(const [key,value] of Object.entries(expected)){
    const got=(actual as Record<string,unknown>)[key];
    expect(typeof got,key).toBe('number');expect(Number.isFinite(got),key).toBe(true);
    expect(Math.abs(Number(got)-value),`${key}: expected ${value}, received ${got}`).toBeLessThanOrEqual(tolerance);
  }
}
function modeFor(slug:string,algorithm:string):Mode{
  const mode=definitionMap.get(slug)?.modes.find(m=>m.algorithm===algorithm);
  expect(mode,`${slug}/${algorithm}`).toBeDefined();return mode!;
}
const metric=(result:Result,label:string)=>{const item=result.metrics.find(m=>m.label===label);expect(item,label).toBeDefined();return Number(item!.value);};
const values=(mode:Mode,input:Record<string,unknown>):Values=>({...defaults(mode),...Object.fromEntries(Object.entries(input).map(([k,v])=>[k,typeof v==='object'?JSON.stringify(v):String(v)]))});

describe('Independent 2025 / 2026 primary-source fixtures',()=>{
  for(const fixture of references.fixtures as unknown as Fixture[]){it(fixture.id,()=>compare(helpers[fixture.target](fixture.inputs),fixture.expected,fixture.absoluteTolerance));}
});

describe('Year validation and visible registration',()=>{
  for(const value of [2025,2026,'2025','2026',undefined])it(`accepts supported year ${String(value)}`,()=>expect(taxYear(value)).toBe(value===undefined?2026:Number(value)));
  for(const value of [2024,2027,'',null,true,Infinity,'2025.0',' 2025 '])it(`rejects unsupported year ${String(value)}`,()=>expect(()=>taxYear(value)).toThrow(/supported tax year/i));
  for(const [slug,algorithm] of [
    ['tax-calculator','tax-federal-composed'],['tax-calculator','tax-standard-expanded'],
    ['tax-calculator','tax-itemization-2026'],['tax-calculator','tax-care-2026'],
    ['tax-calculator','tax-student-interest-2026'],['tax-calculator','tax-ira-deduction-2026'],
    ['tax-calculator','tax-qbi-2026'],['tax-calculator','tax-qbi-section68'],
    ['tax-calculator','tax-eitc-estimate-2026'],['marriage-calculator','tax-marriage-composed'],
    ['take-home-pay-calculator','annual-tax-pay'],
  ])it(`${slug}/${algorithm} exposes one year selector`,()=>{
    const fields=modeFor(slug,algorithm).fields.filter(f=>f.key==='taxYear');expect(fields).toHaveLength(1);
    expect(fields[0].options?.map(o=>o.value)).toEqual(['2026','2025']);
  });
});

describe('Selected year reaches composed and dispatched calculations',()=>{
  for(const year of [2025,2026] as const){
    it(`dispatches ${year} federal income`,async()=>{
      const mode=modeFor('tax-calculator','tax-federal-composed');
      const result=await calculate('finance',mode,values(mode,{taxYear:year,filing:'single',persons:[{wages:60000}],deductionChoice:'standard'}));
      expect(metric(result,'Modeled federal return tax')).toBeCloseTo(year===2025?5071.5:5020,8);
      expect(result.notes?.[0]).toContain(String(year));
    });
    it(`propagates ${year} IRA phaseout`,()=>compare(composition.federalComposition({taxYear:year,filing:'single',persons:[{wages:84000}],iraEnabled:true,iraContributors:[{name:'Taxpayer',age:40,contribution:7500,compensationAvailable:84000,covered:true}]}),{iraDeduction:year===2025?3500:5250,AGI:year===2025?80500:78750}));
    it(`propagates ${year} joint student-interest phaseout`,()=>compare(composition.federalComposition({taxYear:year,filing:'marriedJoint',persons:[{wages:185000},{wages:0}],studentInterestEnabled:true,studentQualifiedInterest:2500}),{studentInterestDeduction:year===2025?1250:1666.6666666666667}));
    it(`propagates ${year} care credit`,()=>compare(composition.federalComposition({taxYear:year,filing:'single',persons:[{wages:45000}],care:{qualifyingPeople:1,unreimbursedEligibleExpenses:3000,earnedIncomeA:45000}}),{preCTCNonrefundableCredits:year===2025?600:1050}));
    it(`propagates ${year} itemized charity floor`,()=>compare(composition.federalComposition({taxYear:year,filing:'single',persons:[{wages:100000}],deductionChoice:'itemized',itemized:{eligibleMedical:10000,eligibleSALT:20000,eligibleCashCharity:1000,otherVerifiedItemized:10000}}),{selectedDeduction:year===2025?33500:33000}));
    it(`propagates ${year} QBI minimum`,()=>compare(composition.federalComposition({taxYear:year,filing:'single',persons:[{wages:0}],ordinaryOther:30000,qbiMethod:'computed',qbiAdjustedQbiBeforeTips:1000,qbiVerifiedActiveQualifiedQbi:1000,qbiMaterialParticipationConfirmed:true}),{qbiDeduction:year===2025?200:400}));
    it(`propagates ${year} EITC constants independently of child credit`,()=>compare(composition.federalComposition({taxYear:year,filing:'single',persons:[{wages:20000}],eitcEnabled:true,eitcChildren:3,eitcEarnedIncome:20000,eitcEligible:true,eitcAge:30}),{estimatedEITC:year===2025?8046:8231}));
    it(`uses ${year} employee Social Security wage cap in annual pay`,()=>{
      const mode=modeFor('take-home-pay-calculator','annual-tax-pay');
      compare(annualPay(values(mode,{taxYear:year,filing:'single',annualIncome:200000,employmentType:'employee',stateRate:0,cityRate:0})),{employeeSS:year===2025?10918.2:11439});
    });
    it(`dispatches ${year} annual net cash`,async()=>{
      const mode=modeFor('take-home-pay-calculator','annual-tax-pay');
      const result=await calculate('finance',mode,values(mode,{taxYear:year,filing:'single',annualIncome:60000,employmentType:'employee',stateRate:0,cityRate:0,periodsPerYear:12}));
      const annual=year===2025?50338.5:50390;
      expect(metric(result,'Estimated annual net cash')).toBeCloseTo(annual,8);
      expect(metric(result,'Average per selected pay period')).toBeCloseTo(annual/12,8);
    });
    it(`dispatches ${year} marriage scenarios and keeps labels`,async()=>{
      const mode=modeFor('marriage-calculator','tax-marriage-composed');
      const result=await calculate('finance',mode,values(mode,{taxYear:year,filingA:'single',filingB:'single',wagesA:60000,wagesB:60000,ssWagesA:60000,ssWagesB:60000,medicareWagesA:60000,medicareWagesB:60000,dependents:[],verifiedScenarioAmounts:[]}));
      expect(metric(result,'Person A modeled return tax')).toBeCloseTo(year===2025?5071.5:5020,8);
      expect(metric(result,'Person B modeled return tax')).toBeCloseTo(year===2025?5071.5:5020,8);
      expect(metric(result,'Joint modeled return tax')).toBeCloseTo(year===2025?10143:10040,8);
      expect(result.metrics.every(m=>typeof m.label==='string'&&m.label.trim().length>0)).toBe(true);
    });
  }
  it('preserves 2025 gain stacking through the federal wrapper',()=>compare(composition.federalComposition({taxYear:2025,filing:'single',persons:[{wages:40000}],netEligibleLTCG:20000,deductionChoice:'verified',verifiedDeduction:0}),{gain0:8350,gain15:11650,gain20:0,regularTax:6309}));
  it('retains the separate 2026 W-4 mode without a misleading year selector',()=>expect(modeFor('take-home-pay-calculator','tax-paycheck-composed').fields.some(f=>f.key==='taxYear')).toBe(false));
});

describe('Independent three-plus ACTC and adjusted payroll worksheets',()=>{
  for(const fixture of actcReferences.fixtures){it(fixture.id,()=>compare(additionalChildCredit(fixture.inputs),fixture.expected));}
  for(const fixture of actcReferences.adjustedPayrollWorksheetFixtures){it(fixture.id,()=>expect(adjustedChildCreditPayroll(fixture.inputs)).toBeCloseTo(fixture.expectedLine21,8));}
  for(const flag of [true,'yes'])it(`disallows ACTC when Form2555 flag is ${String(flag)}`,()=>compare(additionalChildCredit({qualifyingChildren:3,preliminaryDependentCredit:6600,ACTCEarnedIncome:20000,verifiedAdjustedPayrollTaxesLine21:5000,form2555:flag}),{ACTC:0}));
  for(const children of [-1,2.5,21])it(`rejects invalid child count ${children}`,()=>expect(()=>additionalChildCredit({qualifyingChildren:children})).toThrow());
  it('rejects nonrefundable credit exceeding preliminary credit',()=>expect(()=>additionalChildCredit({qualifyingChildren:3,preliminaryDependentCredit:100,nonrefundableDependentCredit:101})).toThrow(/cannot exceed/i));
  it('rejects a negative adjusted payroll worksheet result',()=>expect(()=>adjustedChildCreditPayroll({W2Box4:100,additionalMedicareWithheld:101})).toThrow(/cannot be negative/i));
  for(const amount of [-1,Infinity,NaN])it(`rejects invalid payroll amount ${String(amount)}`,()=>expect(()=>additionalChildCredit({qualifyingChildren:3,preliminaryDependentCredit:6600,verifiedAdjustedPayrollTaxesLine21:amount})).toThrow());
});

describe('ACTC credits and state payments are composed once',()=>{
  for(const year of [2025,2026]){
    it(`uses the ${year} common payroll alternative for three low-income children`,()=>compare(composition.federalComposition({taxYear:year,filing:'single',persons:[{wages:2000}],qualifyingChildren:3}),{ACTC:153,refundableCredits:153,refund:153}));
    it(`keeps verified payroll, EITC and excess-SS amounts separate in ${year}`,()=>compare(composition.federalComposition({taxYear:year,filing:'single',persons:[{wages:2000}],qualifyingChildren:3,ACTCPayrollMode:'verified',ACTCAdjustedPayroll:1000,verifiedEITC:100,excessSocialSecurityCredit:50}),{ACTC:850,allowedEITC:100,refundableCredits:950,payments:50,refund:1000}));
    it(`does not add a supplied EITC again when its estimate is enabled in ${year}`,()=>compare(composition.federalComposition({taxYear:year,filing:'single',persons:[{wages:1000}],qualifyingChildren:3,eitcEnabled:true,eitcChildren:3,eitcEarnedIncome:1000,eitcAge:30,eitcEligible:true,verifiedEITC:9999}),{ACTC:0,estimatedEITC:450,allowedEITC:450,refundableCredits:450,refund:450}));
    it(`dispatches three children and verified payroll controls for ${year}`,async()=>{
      const mode=modeFor('tax-calculator','tax-federal-composed');
      const result=await calculate('finance',mode,values(mode,{taxYear:year,filing:'single',persons:[{wages:2000}],qualifyingChildren:3,ACTCPayrollMode:'verified',ACTCAdjustedPayroll:1000,verifiedEITC:100,excessSocialSecurityCredit:50,federalIncomeTaxWithheld:0}));
      expect(metric(result,'Refundable additional child credit')).toBeCloseTo(850,8);
      expect(metric(result,'Estimated refund')).toBeCloseTo(1000,8);
    });
    it(`keeps state payments outside the federal refund for ${year}`,async()=>{
      const mode=modeFor('tax-calculator','tax-federal-composed');
      const result=await calculate('finance',mode,values(mode,{taxYear:year,filing:'single',persons:[{wages:60000}],stateLocalRate:5,stateLocalBase:'entered',stateLocalEnteredBase:50000,stateLocalPayments:3000,federalIncomeTaxWithheld:0}));
      expect(metric(result,'State Local Tax')).toBeCloseTo(2500,8);
      expect(metric(result,'State Local Refund')).toBeCloseTo(500,8);
      expect(metric(result,'Estimated refund')).toBe(0);
      expect(metric(result,'Estimated amount due')).toBeCloseTo(year===2025?5071.5:5020,8);
    });
  }
  it('has no duplicate field keys in the annual-pay mode',()=>{
    const fields=modeFor('take-home-pay-calculator','annual-tax-pay').fields;
    expect(fields.map(f=>f.key).filter((key,index,keys)=>keys.indexOf(key)!==index)).toEqual([]);
  });
  it('uses verified line21 without adding the common employee payroll again',()=>compare(composition.federalComposition({filing:'single',persons:[{wages:2000}],qualifyingChildren:3,ACTCPayrollMode:'verified',ACTCAdjustedPayroll:100}),{ACTC:100}));
  it('keeps Additional Medicare withholding out of the common final-liability payroll branch',()=>compare(composition.federalComposition({filing:'single',persons:[{wages:2000}],qualifyingChildren:3,additionalMedicareWithheld:50}),{ACTC:153,payments:50,refund:203}));
  it('blocks composed ACTC with Form2555',()=>compare(composition.federalComposition({filing:'single',persons:[{wages:2000}],qualifyingChildren:3,form2555:'yes'}),{ACTC:0,refundableCredits:0}));
});

describe('Captured Form2555 facts override incompatible credit assumptions',()=>{
  it('disallows an otherwise eligible computed EITC',()=>compare(composition.federalComposition({filing:'single',persons:[{wages:1000}],qualifyingChildren:3,form2555:'yes',eitcEnabled:true,eitcEligible:true,eitcChildren:3,eitcEarnedIncome:1000,eitcAge:30}),{estimatedEITC:0,allowedEITC:0,ACTC:0,refundableCredits:0}));
  it('does not revive EITC through a verified amount when Form2555 is filed',()=>compare(composition.federalComposition({filing:'single',persons:[{wages:1000}],qualifyingChildren:3,form2555:'yes',verifiedEITC:450}),{allowedEITC:0,ACTC:0,refundableCredits:0}));
});
