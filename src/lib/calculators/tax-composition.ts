import {additionalChildCredit} from './child-credit';
import {taxParameters,taxYear} from './tax-year';
import taxReference from '@/data/tax-reference-2026.json';
import {tips, overtime, carInterest, education, studentLoanInterest, traditionalIra, qbi as computeQbi, eitcContinuousEstimate} from './tax-additional';
import {gainTax, standardDeduction, runTaxModule} from './tax-modules';
import {integer} from './helpers';
import {parseRows, rowNumber} from './row-data';
import {metric as m, type Values, type Result} from './types';
export type TaxInputs = Record<string, unknown>;
type Filing = keyof typeof taxReference.standardDeduction;
const amount = (v: TaxInputs, key: string, fallback = 0) => rowNumber(v[key] === undefined ? fallback : v[key], key, 0);
const yes = (value: unknown) => value === true || value === 'yes';
function filing(v: TaxInputs): Filing {const value = String(v.filing || 'single'); if (!Object.hasOwn(taxReference.standardDeduction, value)) throw Error('Choose a supported filing status.'); return value as Filing;}
const moduleMetric = (op: string, inputs: TaxInputs, label: string) => Number(runTaxModule(op, Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, String(v)]))).metrics.find(m => m.label === label)!.value);

export function expandedStandard(v: TaxInputs) {
  const policy=taxParameters(v),year=taxYear(v.taxYear),status = filing(v), conditions = integer(amount(v, 'ageBlindConditions'), 0, status === 'marriedJoint' ? 4 : 2);
  const basic = yes(v.ineligible) ? 0 : yes(v.dependent) ? Math.min(standardDeduction(status, year), Math.max(1350, amount(v, 'earnedIncome') + 450)) : standardDeduction(status, year);
  const additional = yes(v.ineligible) ? 0 : conditions * (status === 'single' || status === 'headOfHousehold' ? policy.additionalStandardDeductionPerAgeOrBlindCondition.unmarriedNotSurvivingSpouse : policy.additionalStandardDeductionPerAgeOrBlindCondition.other);
  return {basic, additional, standard: basic + additional};
}
export function taxableBenefits(v: TaxInputs) {
  const status = filing(v), benefits = amount(v, 'benefits'), cohabiting = status === 'marriedSeparate' && yes(v.livedWithSpouse);
  const lower = cohabiting ? 0 : status === 'marriedJoint' ? 32000 : 25000, width = cohabiting ? 0 : status === 'marriedJoint' ? 12000 : 9000;
  const other = Number(v.otherModifiedIncome ?? 0); if (!Number.isFinite(other)) throw Error('Modified income must be finite.');
  const provisional = .5 * benefits + other + amount(v, 'taxExemptInterest');
  const taxable = Math.min(.85 * benefits, Math.min(.5 * benefits, .5 * Math.min(Math.max(0, provisional - lower), width)) + .85 * Math.max(0, provisional - lower - width));
  return {provisionalIncome: provisional, taxableSocialSecurity: taxable};
}
export function seniorDeduction(v: TaxInputs) {
  const status = filing(v), count = integer(amount(v, 'eligibleCount'), 0, status === 'marriedJoint' ? 2 : 1);
  return status === 'marriedSeparate' ? 0 : count * Math.max(0, 6000 - .06 * Math.max(0, amount(v, 'MAGI') - (status === 'marriedJoint' ? 150000 : 75000)));
}
export function itemizedDeduction(v: TaxInputs) {
  const policy=taxParameters(v),limits=policy.itemized,status = filing(v), agi = amount(v, 'AGI'), separate = status === 'marriedSeparate';
  const medical = Math.max(0, amount(v, 'eligibleMedical') - .075 * agi);
  const saltCap = Math.max(separate ? 5000 : 10000, (separate ? limits.saltCapMFS : limits.saltCap) - .3 * Math.max(0, amount(v, 'SALTMAGI', agi) - (separate ? limits.saltMAGIStartMFS : limits.saltMAGIStart)));
  const salt = Math.min(amount(v, 'eligibleSALT'), saltCap), cash = amount(v, 'eligibleCashCharity');
  if (cash > .6 * agi + 1e-8 && v.verifiedCharityDeduction === undefined) throw Error('Cash gifts above 60% of AGI, mixed gift classes or carryovers require a separately verified allowed charitable deduction.');
  const charity = v.verifiedCharityDeduction === undefined ? Math.max(0, cash - limits.charityAGIFloor * agi) : amount(v, 'verifiedCharityDeduction');
  const before = medical + salt + charity + amount(v, 'otherVerifiedItemized');
  const top = status === 'marriedJoint' || status === 'qualifyingSurvivingSpouse' ? 768700 : separate ? 384350 : 640600;
  const reduction = (limits.section68Enabled ? 2 / 37 : 0) * Math.min(before, Math.max(0, agi - amount(v, 'QBI') - amount(v, 'schedule1A') - top));
  return {medicalDeduction: medical, SALTCap: saltCap, SALTDeduction: salt, charityDeduction: charity, beforeOverallLimit: before, overallReduction: reduction, itemizedDeduction: before - reduction};
}
export function careCredit(v: TaxInputs) {
  const policy=taxParameters(v),status = filing(v), count = integer(amount(v, 'qualifyingPeople', 1), 0, 20), agi = amount(v, 'AGI');
  const first = Math.max(.35, .5 - .01 * Math.ceil(Math.max(0, agi - 15000) / 2000));
  const rate = taxYear(v.taxYear)===2025?Math.max(.2,policy.careCredit.initialRate-.01*Math.ceil(Math.max(0,agi-15000)/2000)):Math.max(.2, first - .01 * Math.ceil(Math.max(0, agi - (status === 'marriedJoint' ? 150000 : 75000)) / (status === 'marriedJoint' ? 4000 : 2000)));
  const cap = Math.max(0, (count === 0 ? 0 : count === 1 ? 3000 : 6000) - amount(v, 'excludedBenefits'));
  const base = Math.min(amount(v, 'unreimbursedEligibleExpenses'), cap, amount(v, 'earnedIncomeA'), status === 'marriedJoint' ? amount(v, 'earnedIncomeB') : Infinity);
  if (status === 'marriedSeparate' && count) throw Error('This care-credit branch excludes married-filing-separately eligibility exceptions.');
  return {rate, expenseCap: cap, eligibleExpenseBase: base, tentativeCredit: base * rate};
}

export function federalComposition(v: TaxInputs) {
  const status = filing(v),year=taxYear(v.taxYear),policy=taxParameters(v);
  const persons = v.persons as TaxInputs[];
  if (!Array.isArray(persons) || persons.length !== (status === 'marriedJoint' ? 2 : 1) || persons.some(p => !p || typeof p !== 'object' || Array.isArray(p))) throw Error('Use two person records for a joint scenario and one for other filing statuses.');
  const se = persons.map(p => {const earnings = amount(p, 'businessProfit') * .9235, taxableEarnings = earnings < 400 ? 0 : earnings, ss = Math.min(taxableEarnings, Math.max(0, policy.socialSecurityWageBase - amount(p, 'ssWages', amount(p, 'wages')))) * .124, medicare = taxableEarnings * .029; return {earnings, taxableEarnings, ss, medicare, tax: ss + medicare};});
  const sum = (key: string) => persons.reduce((total, p) => total + amount(p, key), 0);
  const baseSETax = se.reduce((sum, p) => sum + p.tax, 0), halfSEDeduction = baseSETax / 2;
  const preferential = amount(v, 'qualifiedDividends') + amount(v, 'netEligibleLTCG');
  const beforeLocalAdjustments = sum('wages') + sum('businessProfit') + amount(v, 'ordinaryOther') + preferential - amount(v, 'otherAdjustments') - halfSEDeduction;
  let iraDeduction=0;
  if(yes(v.iraEnabled)){
    if(amount(v,'socialSecurityBenefits')>0)throw Error('IRA deductions with Social Security benefits require the coordinated IRS worksheet. Disable this common IRA branch and enter a separately verified above-line adjustment.');
    const contributors=v.iraContributors as TaxInputs[];
    if(!Array.isArray(contributors)||contributors.length>persons.length)throw Error('Enter at most one IRA contributor per taxpayer.');
    const names=new Set<string>();
    for(const p of contributors){const name=String(p.name||'').trim().toLowerCase();if(!name||names.has(name))throw Error('IRA contributor labels must be unique and nonempty.');names.add(name);iraDeduction+=traditionalIra({...p,taxYear:year,filing:status,MAGI:beforeLocalAdjustments+amount(v,'iraMAGIAddback'),livedApartAllYear:v.iraLivedApart}).deduction;}
  }
  const taxableSocialSecurity = taxableBenefits({filing: status, benefits: amount(v, 'socialSecurityBenefits'), otherModifiedIncome: beforeLocalAdjustments-iraDeduction + amount(v, 'ssaAdjustmentAddback'), taxExemptInterest: amount(v, 'taxExemptInterest'), livedWithSpouse: v.livedWithSpouse}).taxableSocialSecurity;
  const studentInterestDeduction=yes(v.studentInterestEnabled)?studentLoanInterest({taxYear:year,filing:status,MAGI:beforeLocalAdjustments-iraDeduction+taxableSocialSecurity+amount(v,'studentMAGIAddback'),qualifiedInterest:amount(v,'studentQualifiedInterest'),eligible:v.studentInterestEligible,dependent:v.studentDependent}).deduction:0;
  const preSsa=beforeLocalAdjustments-iraDeduction-studentInterestDeduction;
  const AGI = preSsa + taxableSocialSecurity;
  if (AGI < 0) throw Error('This scenario excludes loss and net-operating-loss rules; adjustments cannot produce negative AGI.');
  const earned = Math.max(0, sum('wages') + sum('businessProfit') - halfSEDeduction);
  const standard = expandedStandard({taxYear:year,filing: status, ageBlindConditions: amount(v, 'ageBlindConditions'), dependent: v.dependent, earnedIncome: amount(v, 'dependentEarnedIncome', earned), ineligible: v.standardIneligible});
  const senior = seniorDeduction({filing: status, eligibleCount: amount(v, 'seniorCount'), MAGI: AGI + amount(v, 'seniorMAGIAddback')});
  const scheduleMAGI=AGI+amount(v,'scheduleMAGIAddback');
  const tipDeduction=yes(v.tipsEnabled)?tips({filing:status,MAGI:scheduleMAGI,eligible:v.tipsEligible,employeeTips:amount(v,'tipsEmployee'),businesses:v.tipsBusinesses}).deduction:0;
  const overtimeDeduction=yes(v.overtimeEnabled)?overtime({filing:status,MAGI:scheduleMAGI,eligible:v.overtimeEligible,qualifiedPremium:amount(v,'overtimePremium')}).deduction:0;
  const vehicleInterestDeduction=yes(v.carEnabled)?carInterest({filing:status,MAGI:scheduleMAGI,eligible:v.carEligible,loans:v.carLoans}).deduction:0;
  const schedule1A = senior + tipDeduction + overtimeDeduction + vehicleInterestDeduction + amount(v, 'verifiedOtherSchedule1A');
  let qbi = v.qbiMethod==='computed'?0:amount(v, 'verifiedQBI');
  const choice = String(v.deductionChoice || 'standard');
  const itemizedInput = (v.itemized || {}) as TaxInputs;
  const itemized = ['auto','itemized'].includes(choice)||(yes(v.standardIneligible)&&choice!=='verified') ? itemizedDeduction({...itemizedInput,taxYear:year, filing: status, AGI, SALTMAGI: AGI + amount(v, 'saltMAGIAddback'), QBI: qbi, schedule1A}) : {itemizedDeduction:0,beforeOverallLimit:0};
  const standardWithCharity = standard.standard + (yes(v.standardIneligible) ? 0 : Math.min(amount(v, 'eligibleNonitemizerCashCharity'), status === 'marriedJoint' ? policy.itemized.nonitemizerCharityCapJoint : policy.itemized.nonitemizerCharityCap));
  if (!['standard', 'itemized', 'auto', 'verified'].includes(choice)) throw Error('Choose a supported deduction method.');
  if (choice === 'standard' && yes(v.standardIneligible)) throw Error('The standard deduction is unavailable under the selected eligibility assumption.');
  let selectedDeduction = choice === 'verified' ? amount(v, 'verifiedDeduction') : choice === 'itemized' || yes(v.standardIneligible) ? itemized.itemizedDeduction : choice === 'auto' ? Math.max(standardWithCharity, itemized.itemizedDeduction) : standardWithCharity;
  if(v.qbiMethod==='computed'){
    if(choice==='verified')throw Error('Use the standard or itemized inputs for computed QBI, so its income limit can exclude the overall itemized reduction. A verified final deduction requires a separately verified QBI deduction.');
    const input:TaxInputs={taxYear:year,filing:status,netCapitalGainPlusQualifiedDividends:preferential};
    for(const key of ['adjustedQbiBeforeTips','deductibleBusinessTips','priorQbiLoss','SSTB','qualifiedBusinessW2Wages','qualifiedUBIA','verifiedActiveQualifiedQbi','materialParticipationConfirmed'])input[key]=v['qbi'+key[0].toUpperCase()+key.slice(1)];
    const scenario=(deduction:number,isItemized:boolean)=>{const q=computeQbi({...input,taxableBeforeQbiWithoutSection68:Math.max(0,AGI-deduction-schedule1A)}).deduction;const final=isItemized?itemizedDeduction({...itemizedInput,taxYear:year,filing:status,AGI,SALTMAGI:AGI+amount(v,'saltMAGIAddback'),QBI:q,schedule1A}).itemizedDeduction:deduction;return {q,final,taxable:Math.max(0,AGI-final-q-schedule1A)};};
    const alternatives=[];
    if(choice!=='itemized'&&!yes(v.standardIneligible))alternatives.push(scenario(standardWithCharity,false));
    if(choice!=='standard'||yes(v.standardIneligible))alternatives.push(scenario(itemized.beforeOverallLimit,true));
    const best=alternatives.sort((a,b)=>a.taxable-b.taxable)[0];qbi=best.q;selectedDeduction=best.final;
  }
  const taxableIncome = Math.max(0, AGI - selectedDeduction - qbi - schedule1A), preferentialTaxable = Math.min(preferential, taxableIncome), ordinaryTaxable = taxableIncome - preferentialTaxable;
  const gains = gainTax(ordinaryTaxable, preferentialTaxable, status,year), additionalAMT = amount(v, 'verifiedAdditionalAMT');
  const care = v.care ? careCredit({...v.care as TaxInputs,taxYear:year, filing: status, AGI}).tentativeCredit : 0;
  const precedingCredits = Math.min(gains.total + additionalAMT, amount(v, 'verifiedPreCTCNonrefundableCredits') + care);
  const educationResult=yes(v.educationEnabled)?education({filing:status,MAGI:AGI+amount(v,'educationMAGIAddback'),eligible:v.educationEligible,students:v.educationStudents,claimantAge:v.educationClaimantAge,claimantFullTimeStudent:v.educationClaimantFullTimeStudent,earnedIncome:v.educationEarnedIncome,support:v.educationSupport,parentAlive:v.educationParentAlive,availableNonrefundableTax:gains.total+additionalAMT-precedingCredits}):{allowedNonrefundable:0,refundableAotc:0};
  const preCTCNonrefundableCredits = precedingCredits+educationResult.allowedNonrefundable;
  const limit = gains.total + additionalAMT - preCTCNonrefundableCredits, children = integer(amount(v, 'qualifyingChildren'), 0, 20), dependents = integer(amount(v, 'otherDependents'), 0, 20);
  const preliminaryCTC = Math.max(0, 2200 * children + 500 * dependents - 50 * Math.ceil(Math.max(0, AGI + amount(v, 'ctcMAGIAddback') - (status === 'marriedJoint' ? 400000 : 200000)) / 1000));
  const nonrefundableCTC = Math.min(preliminaryCTC, limit);
  const incomeTaxAfterCredits = limit - nonrefundableCTC, medicareWages = persons.reduce((sum, p) => sum + amount(p, 'medicareWages', amount(p, 'wages')), 0);
  const additionalMedicare = .009 * Math.max(0, medicareWages + se.reduce((sum, p) => sum + p.taxableEarnings, 0) - taxReference.additionalMedicareThreshold[status]);
  const niitThreshold = status === 'marriedJoint' || status === 'qualifyingSurvivingSpouse' ? 250000 : status === 'marriedSeparate' ? 125000 : 200000;
  const NIIT = .038 * Math.min(amount(v, 'eligibleNII'), Math.max(0, AGI + amount(v, 'niitMAGIAddback') - niitThreshold));
  const eitcInput:TaxInputs={taxYear:year,filing:status,AGI};for(const key of ['children','earnedIncome','investmentIncome','age','spouseAge','separatedSpouseEligibilityConfirmed','eligible'])eitcInput[key]=v['eitc'+key[0].toUpperCase()+key.slice(1)];
  const estimatedEITC=!yes(v.form2555)&&yes(v.eitcEnabled)?eitcContinuousEstimate(eitcInput).estimatedCredit:0;
  const allowedEITC = yes(v.form2555) ? 0 : yes(v.eitcEnabled) ? estimatedEITC : amount(v, 'verifiedEITC');
  const wageAdditionalMedicare = .009 * Math.max(0, medicareWages - taxReference.additionalMedicareThreshold[status]);
  const commonPayroll = persons.reduce((sum,p)=>sum + .062*Math.min(policy.socialSecurityWageBase,amount(p,'ssWages',amount(p,'wages'))),0) + .0145*medicareWages + wageAdditionalMedicare + .5*(additionalMedicare-wageAdditionalMedicare);
  const {ACTC} = additionalChildCredit({qualifyingChildren:children, preliminaryDependentCredit:preliminaryCTC, nonrefundableDependentCredit:nonrefundableCTC, ACTCEarnedIncome:amount(v,'ACTCEarnedIncome',earned), verifiedAdjustedPayrollTaxesLine21:v.ACTCPayrollMode==='verified'?amount(v,'ACTCAdjustedPayroll'):commonPayroll, deductibleHalfBaseSE:halfSEDeduction, verifiedUnreportedPayrollTaxesLine22:amount(v,'ACTCUnreportedPayroll'),actualEITC:allowedEITC,excessSocialSecurityCredit:amount(v,'excessSocialSecurityCredit'),form2555:v.form2555});
  const modeledReturnTax = incomeTaxAfterCredits + baseSETax + additionalMedicare + NIIT + amount(v, 'verifiedOtherTax'), refundableCredits = ACTC + educationResult.refundableAotc + allowedEITC + amount(v, 'verifiedOtherRefundableCredits');
  const payments = amount(v, 'federalIncomeTaxWithheld') + amount(v, 'additionalMedicareWithheld') + amount(v, 'estimatedPayments') + amount(v, 'verifiedPaymentCredits') + amount(v,'excessSocialSecurityCredit'), netFederalBurden = modeledReturnTax - refundableCredits;
  return {baseSETax, halfSEDeduction, SEByPerson: se, iraDeduction, studentInterestDeduction, tipDeduction, overtimeDeduction, vehicleInterestDeduction, qbiDeduction:qbi, estimatedEITC, allowedEITC, nonrefundableEducation:educationResult.allowedNonrefundable, refundableEducation:educationResult.refundableAotc, taxableSocialSecurity, AGI, standardDeduction: standard.standard, selectedDeduction, seniorDeduction: senior, taxableIncome, ordinaryTaxable, preferentialTaxable, gain0: gains.g0, gain15: gains.g15, gain20: gains.g20, regularTax: gains.total, additionalAMT, preCTCNonrefundableCredits, preliminaryCTC, nonrefundableCTC, ACTC, incomeTaxAfterCredits, additionalMedicare, NIIT, modeledReturnTax, refundableCredits, payments, netFederalBurden, refund: Math.max(0, payments - netFederalBurden), amountDue: Math.max(0, netFederalBurden - payments)};
}

export function paycheckComposition(v: TaxInputs) {
  const grossCash = amount(v, 'grossCash'), deductions = (v.deductions || []) as TaxInputs[];
  if (!Array.isArray(deductions) || deductions.length > 100) throw Error('Enter at most 100 employee deduction lines.');
  const total = (flag?: string) => deductions.reduce((sum, row) => sum + (!flag || yes(row[flag]) ? amount(row, 'amount') : 0), 0);
  const federalWageBase = grossCash + amount(v, 'noncashFederalTaxable') - total('reducesFederal'), ssWageBase = grossCash + amount(v, 'noncashSS') - total('reducesSS'), medicareWageBase = grossCash + amount(v, 'noncashMedicare') - total('reducesMedicare');
  if (Math.min(federalWageBase, ssWageBase, medicareWageBase) < 0) throw Error('Deductions cannot make a payroll wage base negative.');
  const status = v.filing === 'marriedJoint' || v.filing === 'headOfHousehold' ? String(v.filing) : 'singleOrMarriedSeparate';
  const federalWithholding = moduleMetric('tax-payroll-w4', {filingStatus: status, periodTaxableWages: federalWageBase, periodsPerYear: integer(amount(v, 'periods', 26), 1, 366), step2Checked: yes(v.step2) ? 'yes' : 'no', step3Credit: amount(v, 'step3'), step4aOtherIncome: amount(v, 'step4a'), step4bDeductions: amount(v, 'step4b'), step4cExtra: amount(v, 'step4c')}, 'Federal withholding this period');
  const employeeSS = Math.min(ssWageBase, Math.max(0, 184500 - amount(v, 'priorSS'))) * .062, employeeMedicare = medicareWageBase * .0145;
  const additionalMedicareWithheld = .009 * (Math.max(0, amount(v, 'priorMedicare') + medicareWageBase - 200000) - Math.max(0, amount(v, 'priorMedicare') - 200000));
  const employeeDeductions = total(), stateLocalWithheld = amount(v, 'stateLocalWithheld');
  return {grossCash, federalWageBase, ssWageBase, medicareWageBase, federalWithholding, employeeSS, employeeMedicare, additionalMedicareWithheld, employeeDeductions, stateLocalWithheld, netPay: grossCash - employeeDeductions - federalWithholding - employeeSS - employeeMedicare - additionalMedicareWithheld - stateLocalWithheld};
}

export function marriageComposition(v: {scenarioA: TaxInputs; scenarioB: TaxInputs; joint: TaxInputs}) {
  if (!['single', 'headOfHousehold','qualifyingSurvivingSpouse'].includes(String(v.scenarioA.filing || 'single')) || !['single', 'headOfHousehold','qualifyingSurvivingSpouse'].includes(String(v.scenarioB.filing || 'single')) || v.joint.filing !== 'marriedJoint') throw Error('Compare eligible single, head-of-household or qualifying-surviving-spouse scenarios with a joint scenario.');
  const a = federalComposition(v.scenarioA), b = federalComposition(v.scenarioB), joint = federalComposition(v.joint);
  const stateLocal=(input:TaxInputs,result:typeof a)=>{const rate=amount(input,'stateLocalRatePercent');if(rate>100)throw Error('State/local planning rate must be at most 100%.');return rate/100*(input.stateLocalBaseChoice==='entered'?amount(input,'stateLocalTaxBase'):result.AGI);};
  const stateLocalA=stateLocal(v.scenarioA,a),stateLocalB=stateLocal(v.scenarioB,b),stateLocalJoint=stateLocal(v.joint,joint),jointTaxReduction=a.netFederalBurden+b.netFederalBurden-joint.netFederalBurden;
  return {taxA: a.modeledReturnTax, taxB: b.modeledReturnTax, taxJoint: joint.modeledReturnTax, netBurdenA: a.netFederalBurden, netBurdenB: b.netFederalBurden, netBurdenJoint: joint.netFederalBurden, jointTaxReduction, stateLocalA, stateLocalB, stateLocalJoint, combinedTaxReduction:jointTaxReduction+stateLocalA+stateLocalB-stateLocalJoint, scenarios: [a, b, joint]};
}
export function prepareFederalInput(v:Values):TaxInputs{
  const input:TaxInputs={...v,persons:parseRows(v.persons,'Persons'),itemized:{eligibleMedical:v.eligibleMedical,eligibleSALT:v.eligibleSALT,eligibleCashCharity:v.eligibleCashCharity,otherVerifiedItemized:v.otherVerifiedItemized}};
  for(const key of ['tipsBusinesses','carLoans','iraContributors','educationStudents'])if(v[key]!==undefined)input[key]=parseRows(v[key],key);
  if(v.careEnabled==='yes')input.care={qualifyingPeople:v.careQualifyingPeople,unreimbursedEligibleExpenses:v.careExpenses,excludedBenefits:v.careExcludedBenefits,earnedIncomeA:v.careEarnedA,earnedIncomeB:v.careEarnedB};
  return input;
}
export const taxCompositionAlgorithms = new Set(['tax-federal-composed', 'tax-paycheck-composed', 'tax-standard-expanded', 'tax-social-benefits', 'tax-senior-deduction', 'tax-itemization-2026', 'tax-care-2026', 'tax-marriage-composed']);
export function runTaxComposition(op: string, v: Values): Result {
  let values: Record<string, number>;
  const notes = [`${taxYear(v.taxYear)} US federal planning arithmetic, parameters checked October 9, 2026. Bracket formulas may differ from IRS tax-table rounding. Eligibility is supplied, not inferred.`];
  if (op === 'tax-marriage-composed') {
    const configs = ['A', 'B'].map(suffix => {
      const person = {wages: v['wages' + suffix], ssWages: v['ssWages' + suffix], medicareWages: v['medicareWages' + suffix], businessProfit: v['businessProfit' + suffix]};
      const value: TaxInputs = {taxYear:v.taxYear,filing: v['filing' + suffix], persons: [person], deductionChoice: 'standard'};
      for (const key of ['ordinaryOther', 'qualifiedDividends', 'netEligibleLTCG', 'eligibleNII', 'socialSecurityBenefits', 'ageBlindConditions', 'seniorCount','stateLocalBaseChoice','stateLocalTaxBase','stateLocalRatePercent']) value[key] = v[key + suffix];
      return value;
    });
    const joint: TaxInputs = {taxYear:v.taxYear,filing: 'marriedJoint', persons: configs.flatMap(c => c.persons as TaxInputs[]), deductionChoice: 'standard'};
    for (const key of ['ordinaryOther', 'qualifiedDividends', 'netEligibleLTCG', 'eligibleNII', 'socialSecurityBenefits', 'ageBlindConditions', 'seniorCount']) joint[key] = amount(configs[0], key) + amount(configs[1], key);
    for(const key of ['stateLocalBaseChoice','stateLocalTaxBase','stateLocalRatePercent'])joint[key]=v[key+'Joint'];
    const ids = new Set<string>();
    for (const dependent of parseRows(v.dependents, 'Dependent scenarios')) {
      const id = String(dependent.identifier || '').trim();
      if (!id || ids.has(id)) throw Error('Each dependent needs one unique identifier; do not count a dependent twice.');
      ids.add(id);
      if (!['A', 'B'].includes(String(dependent.beforeClaim)) || !['child', 'other'].includes(String(dependent.kind))) throw Error('Choose a claimant and dependent category.');
      const key = dependent.kind === 'child' ? 'qualifyingChildren' : 'otherDependents', target = configs[dependent.beforeClaim === 'A' ? 0 : 1];
      target[key] = amount(target, key) + 1; joint[key] = amount(joint, key) + 1;
    }
    const allowed = ['verifiedDeduction', 'verifiedQBI', 'verifiedOtherSchedule1A', 'verifiedAdditionalAMT', 'verifiedPreCTCNonrefundableCredits', 'verifiedOtherRefundableCredits', 'verifiedOtherTax', 'otherAdjustments', 'verifiedEITC', 'ACTCAdjustedPayroll', 'ACTCUnreportedPayroll', 'excessSocialSecurityCredit'];
    const seen = new Set<string>();
    for (const row of parseRows(v.verifiedScenarioAmounts, 'Verified scenario adjustments')) {
      const key = String(row.kind), scenario = String(row.scenario), id = scenario + ':' + key;
      if (!allowed.includes(key) || !['A', 'B', 'joint'].includes(scenario) || seen.has(id)) throw Error('Use one supported adjustment per scenario and category.');
      seen.add(id); const target = scenario === 'joint' ? joint : configs[scenario === 'A' ? 0 : 1]; target[key] = rowNumber(row.amount, 'Verified amount', 0);
      if (key === 'verifiedDeduction') target.deductionChoice = 'verified';if(key==='ACTCAdjustedPayroll')target.ACTCPayrollMode='verified';
    }
    const {scenarios, ...comparison} = marriageComposition({scenarioA: configs[0], scenarioB: configs[1], joint});
    return {metrics: Object.entries(comparison).map(([key, value]) => m(({taxA: 'Person A modeled return tax', taxB: 'Person B modeled return tax', taxJoint: 'Joint modeled return tax', netBurdenA: 'Person A tax after refundable credits', netBurdenB: 'Person B tax after refundable credits', netBurdenJoint: 'Joint tax after refundable credits', jointTaxReduction: 'Joint federal tax reduction', stateLocalA: 'Person A assumed state/local tax', stateLocalB: 'Person B assumed state/local tax', stateLocalJoint: 'Joint assumed state/local tax', combinedTaxReduction: 'Joint federal and assumed state/local reduction'} as Record<string, string>)[key], value, 'money')), table: {headers: ['Component', 'Person A', 'Person B', 'Joint'], rows: ['AGI', 'selectedDeduction', 'seniorDeduction', 'taxableIncome', 'regularTax', 'baseSETax', 'additionalMedicare', 'NIIT', 'nonrefundableCTC', 'ACTC'].map(key => [key.replace(/([a-z])([A-Z])/g, '$1 $2'), ...scenarios.map(s => s[key as keyof typeof s] as number)])}, notes: [...notes, 'Three explicit hypothetical filing scenarios are recomputed. The joint calculation keeps each spouse’s SE/Social Security wage cap separate and recalculates income bands and credit phaseouts.', 'Dependent eligibility must be valid in each scenario. Withholding does not affect this comparison. Separately verified deductions and credits must be entered for each scenario; joint eligibility is not assumed from a combined amount. State/local amounts use independently entered flat rates and bases for each scenario; they are separated from the federal difference. No community-property allocation or recommendation to marry is provided.']};
  } else if (op === 'tax-federal-composed') {
    const input = prepareFederalInput(v);
    const {SEByPerson: _se, ...computed} = federalComposition(input); values = computed; void _se;
    const planningRate=amount(v,'stateLocalRate');if(planningRate>100)throw Error('State/local planning rate must be at most 100%.');
    const stateLocalTax=planningRate/100*(v.stateLocalBase==='entered'?amount(v,'stateLocalEnteredBase'):v.stateLocalBase==='taxable'?computed.taxableIncome:computed.AGI),stateLocalPayments=amount(v,'stateLocalPayments');
    Object.assign(values,{stateLocalTax,stateLocalPayments,stateLocalRefund:Math.max(0,stateLocalPayments-stateLocalTax),stateLocalDue:Math.max(0,stateLocalTax-stateLocalPayments)});
    notes.push('State/local tax is a separate flat-rate planning assumption using your chosen base. It does not implement a state return or automatically feed the federal SALT deduction. State payments do not change the federal refund.');
    notes.push('This combines ordinary income, eligible gains, regular SE tax, taxable Social Security, common deductions, optional qualified tips/overtime/vehicle interest, common IRA/student-interest adjustments, education and basic child credits, NIIT and Additional Medicare. It is not a completed return.', 'QBI uses a verified deduction or a one-business worksheet. Optional EITC is a continuous planning estimate, which can differ from the final IRS income-bin table. AMT and other special amounts require separately verified inputs. Loss netting, foreign-income coordination, Puerto Rico ACTC and special credit-limit worksheet coordination are outside this mode. Three-or-more-child ACTC compares the earned-income and adjusted-payroll branches. Common payroll assumes regular capped employee tax; enter verified Schedule 8812 line 21 for excess withholding, RRTA or other special cases. EITC is counted once as a refundable credit and subtracted once in the ACTC payroll alternative. Generic verified amounts must exclude any deductions or credits calculated above; deductible business tips must be excluded from QBI.', 'Tips and overtime must already be included in income. Student interest is added back for Social Security provisional income; the common IRA branch excludes the coordinated Social Security-benefit worksheet.', 'Ordinary employee Social Security and Medicare are neither federal income-tax withholding nor Form 1040 return tax. Enter Additional Medicare withholding separately, not all W-2 Box 6.');
  } else if (op === 'tax-paycheck-composed') {values = paycheckComposition({...v, deductions: parseRows(v.deductions, 'Employee deductions')}); notes.push('Regular employee pay with 2020-or-later W-4. Each deduction uses its verified effect on federal, Social Security and Medicare wage bases. Noncash fringe amounts change tax bases, not cash pay.', 'State/local withholding is entered. Negative net pay identifies insufficient cash for the entered deductions and withholding; it is not silently capped.');}
  else if (op === 'tax-standard-expanded') values = expandedStandard(v);
  else if (op === 'tax-social-benefits') values = taxableBenefits(v);
  else if (op === 'tax-senior-deduction') values = {seniorDeduction: seniorDeduction(v)};
  else if (op === 'tax-itemization-2026') values = itemizedDeduction(v);
  else values = careCredit(v);
  const labels: Record<string, string> = {netPay: 'Net cash pay', modeledReturnTax: 'Modeled federal return tax', netFederalBurden: 'Tax after refundable credits', amountDue: 'Estimated amount due', refund: 'Estimated refund', AGI: 'Adjusted gross income', NIIT: 'Net investment income tax', ACTC: 'Refundable additional child credit', SALTCap: 'SALT cap', SALTDeduction: 'SALT deduction'};
  const order = op === 'tax-paycheck-composed' ? ['netPay'] : op === 'tax-federal-composed' ? ['modeledReturnTax', 'amountDue', 'refund'] : [];
  const keys = [...order, ...Object.keys(values).filter(key => !order.includes(key))];
  return {metrics: keys.map(key => m(labels[key] || key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase()), key === 'rate' ? values[key] * 100 : values[key], key === 'rate' ? 'percent' : 'money')), notes};
}
