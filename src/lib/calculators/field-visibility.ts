import type {Mode,Values,Field} from './types';
export function isFieldActive(mode:Mode,field:Field,values:Values):boolean{const key=field.key,a=mode.algorithm;
 if(a==='road-route'&&['lat1','lon1','lat2','lon2'].includes(key)&&values.locationInput==='places')return false;
 if(a==='shoe-regions'){
  if(key==='size'&&values.source==='foot')return false;
  if(['length','lengthUnit'].includes(key)&&values.source!=='foot')return false;
 }
 if(a==='heat-loss'){
  if(key==='surfaces'&&values.envelopeInput!=='components')return false;
  if(['ua','uaUnit'].includes(key)&&values.envelopeInput==='components')return false;
 }
 if(['bra','bra-legacy','fashion-ffit'].includes(a)){if(key==='measurementUnit'&&values.unitScheme==='individual')return false;if(['underUnit','bustUnit','waistUnit','hipUnit','highHipUnit'].includes(key)&&values.unitScheme!=='individual')return false;}
 if(a==='vehicle-state-tax'){
  if((key==='price'&&values.solve==='price')||(key==='payment'&&values.solve!=='price'))return false;
  if(['promotionalAprPercent','promotionalQuotedTax'].includes(key)&&values.solve!=='compare')return false;
  if(['quotedTax','promotionalQuotedTax'].includes(key)&&values.taxMethod!=='quoted')return false;
  if(['taxYear','condition','scopeConfirmed','tradeEligible','rebateEligible'].includes(key)&&values.taxMethod!=='state')return false;
  if(['tradeTaxCredit','rebateTaxCredit'].includes(key)&&values.taxMethod!=='manual')return false;
  if(key==='salesTaxPercent'&&values.taxMethod==='quoted')return false;
 }
 if(mode.fields.some(f=>f.key==='outputUnit')&&key.endsWith('Unit')&&!['angleUnit','outputUnit','heightUnit','distanceUnit','speedUnit'].includes(key)){const base=mode.fields.find(f=>f.key===key.slice(0,-4));if(base&&!isFieldActive(mode,base,values))return false;}

 if(['floor-measured','concrete-measured'].includes(a)&&key.endsWith('Unit')){const base=mode.fields.find(f=>f.key===key.slice(0,-4));if(base)return isFieldActive(mode,base,values);}
 if(a==='floor-measured'){
  const active:Record<string,string[]>={rectangle:['length','width'],circle:['outerDiameter'],border:['length','width','border'],ring:['outerDiameter','border'],triangle:['length','width','sideC'],'base-height':['length','width'],trapezoid:['length','width','height'],sector:['radius','angle'],parallelogram:['length','width']};
  if(['length','width','border','outerDiameter','sideC','height','radius','angle'].includes(key)&&!active[values.shape]?.includes(key))return false;
 }
 if(a==='concrete-measured'){
  const active:Record<string,string[]>={slab:['length','width','depth'],column:['outer','height'],tube:['outer','inner','height'],stairs:['risers','width','riser','run','platform'],curb:['curbDepth','gutterWidth','flagThickness','curbHeight','length']};
  if(['length','width','depth','outer','inner','height','risers','riser','run','platform','curbDepth','gutterWidth','flagThickness','curbHeight'].includes(key)&&!active[values.shape]?.includes(key))return false;
 }
 if(a==='molarity-units'){
  if(key==='solutionDensity'&&![values.concentrationUnit,values.outputUnit].some(unit=>unit==='ppm-mass'||unit==='ppb-mass'))return false;
  if(['mass','volume'].includes(key)&&(values.solve==='convert'||values.solve===key))return false;
  if(key==='concentration'&&values.solve==='concentration')return false;
  if(key==='molarMass'&&values.solve==='molarMass')return false;
  if(key==='outputMassUnit'&&values.solve!=='mass')return false;
  if(key==='outputVolumeUnit'&&values.solve!=='volume')return false;
  if(key==='outputUnit'&&!['concentration','convert'].includes(values.solve))return false;
 }
 if(a==='income-gdp'){if(key==='netPaymentsAbroad'&&values.componentBasis!=='national-factor-income')return false;if(key==='netOperatingSurplus'&&values.components!=='aggregate')return false;if(['proprietors','rents','profits','netInterest','otherIncome'].includes(key)&&values.components!=='detailed')return false;}
 if(a==='height-units'&&((key==='centimeters'&&values.direction==='feet-inches-to-cm')||(['feet','inches'].includes(key)&&values.direction!=='feet-inches-to-cm')))return false;
 if(a==='parent-height-units'&&((['mother','father'].includes(key)&&values.parentUnit!=='cm')||(['motherFeet','motherInches','fatherFeet','fatherInches'].includes(key)&&values.parentUnit==='cm')))return false;
 if(a==='quarter-mile'&&((['elapsed','timeUnit'].includes(key)&&values.method!=='et')||(['trapSpeed','speedUnit'].includes(key)&&values.method==='et')))return false;
 if(a==='tire-target'&&((['alternativeRim','alternativeWidth'].includes(key)&&values.comparison==='single')||(['candidateAspect','indicatedSpeed'].includes(key)&&values.comparison!=='candidate')))return false;
 if(a==='roof-measured'&&((['length','width','eaves','unit'].includes(key)&&values.planInput!=='rectangle-dimensions')||(['planArea','areaUnit'].includes(key)&&values.planInput!=='known-horizontal-area')))return false;
 if(a==='roof-packages'&&((key==='packagesPerSquare'&&values.coverageMode!=='packages-per-square')||(['packageCoverage','packageCoverageUnit'].includes(key)&&values.coverageMode==='packages-per-square')))return false;
 if(a==='stairs-layout'&&key==='floorOpening'&&values.headroomMode==='required-opening')return false;
 if(a==='website-units'){if(key==='outputDays'&&values.periodBasis==='calendar-dates')return false;if(['outputStart','outputEnd'].includes(key)&&values.periodBasis!=='calendar-dates')return false;if(key==='monthDays'&&values.viewPeriod!=='month')return false;if(key==='yearDays'&&values.viewPeriod!=='year')return false;}
 if(a==='wire-gauge'){if(key==='area'&&values.sizeInput!=='area-mm2')return false;if(key==='awg'&&values.sizeInput!=='AWG')return false;if(key==='kcmil'&&values.sizeInput!=='kcmil')return false;if(['rho20','alpha'].includes(key)&&values.material!=='custom')return false;if(['material','temperature','rho20','alpha','length','lengthUnit','current','voltage'].includes(key)&&values.calculation==='geometry')return false;}
 if(a==='voltage-impedance'){if(key==='impedanceMode'&&values.system==='dc')return false;if(['reactance','powerFactor','loadType'].includes(key)&&(values.system==='dc'||values.impedanceMode!=='r-and-x'))return false;if(key==='effective'&&(values.system==='dc'||values.impedanceMode!=='effective-longitudinal'))return false;if(key==='resistance'&&values.system!=='dc'&&values.impedanceMode==='effective-longitudinal')return false;}

 if(a==='debt-budget-ledger'&&((key==='extraMonthly'&&values.budgetInput==='total')||(key==='totalMonthlyBudget'&&values.budgetInput!=='total')))return false;
 if(a==='consolidation-fee-comparison'&&key==='percentageBase'&&(values.feeUnit!=='percent'||values.feeTreatment!=='financed'))return false;
 if(a==='landscape-purchasing'){
  const group:Record<string,string[]>={beds:['beds'],area:['known-area'],areaUnit:['known-area'],length:['rectangle'],lengthUnit:['rectangle'],width:['rectangle'],widthUnit:['rectangle'],diameter:['circle'],diameterUnit:['circle']};if(group[key]&&!group[key].includes(values.shape))return false;
  if(['bagSize','bagUnit'].includes(key)&&values.priceBasis!=='bag')return false;
  const mass=values.includeMass==='yes'||['lb','short-ton','kg','tonne'].includes(values.priceBasis)||(values.priceBasis==='bag'&&['lb','kg'].includes(values.bagUnit));if(['density','densityUnit'].includes(key)&&!mass)return false;
 }
 if(a==='heat-energy'){if(key==='massKg'&&values.massInput==='volume')return false;if(['lengthM','widthM','heightM','densityKgM3'].includes(key)&&values.massInput!=='volume')return false;}
 if(['tax-federal-composed','annual-tax-pay'].includes(a)){
  if(key==='verifiedEITC'&&values.eitcEnabled==='yes')return false;
  if(key==='ACTCAdjustedPayroll'&&values.ACTCPayrollMode!=='verified')return false;
  if(key==='stateLocalEnteredBase'&&values.stateLocalBase!=='entered')return false;
  if(key.startsWith('qbi')&&key!=='qbiMethod'&&values.qbiMethod!=='computed')return false;
  if(key==='verifiedQBI'&&values.qbiMethod==='computed')return false;
  if(key.startsWith('eitc')&&key!=='eitcEnabled'&&values.eitcEnabled!=='yes')return false;
  if(key==='eitcSpouseAge'&&values.filing!=='marriedJoint')return false;
  if(key==='eitcSeparatedSpouseEligibilityConfirmed'&&values.filing!=='marriedSeparate')return false;
  const switches:Record<string,string[]>={tipsEnabled:['tipsEligible','tipsEmployee','tipsBusinesses'],overtimeEnabled:['overtimeEligible','overtimePremium'],carEnabled:['carEligible','carLoans'],iraEnabled:['iraContributors','iraMAGIAddback','iraLivedApart'],studentInterestEnabled:['studentInterestEligible','studentQualifiedInterest','studentDependent','studentMAGIAddback'],educationEnabled:['educationEligible','educationStudents','educationClaimantAge','educationClaimantFullTimeStudent','educationEarnedIncome','educationSupport','educationParentAlive','educationMAGIAddback']};
  for(const [toggle,keys]of Object.entries(switches))if(keys.includes(key)&&values[toggle]!=='yes')return false;
  if(key==='scheduleMAGIAddback'&&![values.tipsEnabled,values.overtimeEnabled,values.carEnabled].includes('yes'))return false;
  if(key==='iraLivedApart'&&values.filing!=='marriedSeparate')return false;
  if(key==='livedWithSpouse'&&values.filing!=='marriedSeparate')return false;
  if(['eligibleMedical','eligibleSALT','eligibleCashCharity','otherVerifiedItemized'].includes(key)&&!['auto','itemized'].includes(values.deductionChoice))return false;
  if(key==='verifiedDeduction'&&values.deductionChoice!=='verified')return false;
  if(key==='eligibleNonitemizerCashCharity'&&!['auto','standard'].includes(values.deductionChoice))return false;
  if(['careQualifyingPeople','careExpenses','careExcludedBenefits','careEarnedA','careEarnedB'].includes(key)&&values.careEnabled!=='yes')return false;
  if(key==='careEarnedB'&&values.filing!=='marriedJoint')return false;
 }
 if(a==='annual-tax-pay'){if(key==='businessExpenses'&&values.employmentType!=='self')return false;if(key==='allWageBaseDeductions'&&values.employmentType==='self')return false;if(key==='stateLocalEnteredBase'&&values.stateLocalBase!=='entered')return false;}
 if(a==='tax-marriage-composed'&&key.startsWith('stateLocalTaxBase')&&values['stateLocalBaseChoice'+key.slice('stateLocalTaxBase'.length)]!=='entered')return false;
 if(a==='tax-standard-expanded'&&key==='earnedIncome'&&values.dependent!=='yes')return false;
 if(a==='tax-social-benefits'&&key==='livedWithSpouse'&&values.filing!=='marriedSeparate')return false;
 if(a==='tax-care-2026'&&key==='earnedIncomeB'&&values.filing!=='marriedJoint')return false;
 if(a==='tax-ordinary-detailed'){if(key==='ordinaryIncome'&&values.incomeInput==='lines')return false;if(key==='ordinaryIncomeLines'&&values.incomeInput!=='lines')return false;if(key==='enteredDeduction'&&values.deductionMode!=='entered')return false;}
 if(a==='tax-marriage-scenarios'&&['deductionA','deductionB','jointDeduction'].includes(key)&&values.deductionMode!=='entered')return false;
 if(a==='bsa-research'&&key==='sex'&&values.method!=='schlich')return false;
 if(a==='pace-units'){
  const group:Record<string,string[]>={distance:['pace','time'],pace:['time','distance'],paceUnit:['time','distance'],completed:['finish'],total:['finish'],splits:['splits'],value:['convert'],unit:['convert'],timeInput:['pace','distance','finish'],minutes:['pace','distance','finish'],elapsed:['pace','distance','finish']};
  if(group[key]&&!group[key].includes(values.solve))return false;
  if(key==='minutes'&&values.timeInput==='hms')return false;if(key==='elapsed'&&values.timeInput!=='hms')return false;
  if(key==='distanceUnit'&&values.solve==='convert')return false;
 }
 if(['program-policy','program-composed'].includes(a)){if(key==='originalLtvPercent'&&values.program!=='FHAstandard-forward')return false;if(['vaUse','downPercentOfPurchasePrice','vaExemptionReason'].includes(key)&&values.program==='FHAstandard-forward')return false;if(key==='downPercentOfPurchasePrice'&&values.program!=='VApurchase')return false;if(key==='vaUse'&&values.program==='VAIRRRL')return false;}
 if(a==='program-composed'){
  if(['policyDate','originalLtvPercent','vaUse','downPercentOfPurchasePrice','vaExemptionReason'].includes(key)&&['manual','historical'].includes(values.policySource))return false;
  if(['manualUpfrontRate','manualAnnualMip','manualOriginalPi'].includes(key)&&!['manual','historical'].includes(values.policySource))return false;
  if(key==='manualLastMipMonth'&&values.policySource!=='manual')return false;
  if(['verifiedEligibleMMI','closingDate','caseAssignedDate','originalPrice','originalAppraisal'].includes(key)&&values.policySource!=='historical')return false;
 }
 if(a==='dated-bond'&&((key==='cleanPricePer100'&&values.solve!=='yield')||(key==='nominalYieldPercent'&&values.solve==='yield')))return false;
 if(a==='early-distribution'){if(['fromSeparatedEmployerPlan','separationYear'].includes(key)&&values.accountType!=='traditional401k')return false;if(key==='separationYear'&&values.fromSeparatedEmployerPlan!=='yes')return false;}
 if(a==='social-streams'){if(key==='birthDate'&&values.fraInput!=='birth-date')return false;if(key==='fraMonths'&&values.fraInput==='birth-date')return false;if(['suppliedBenefitA','suppliedBenefitB'].includes(key)&&values.benefitInput!=='supplied')return false;}
 if(a==='owner-rmd'){if(key==='spouseBirthDate'&&values.spouseSoleBeneficiaryEntireApplicablePeriod!=='yes')return false;if(['stillEmployed','ownsMoreThan5Percent','planAllowsEmploymentDeferral'].includes(key)&&!['eligibleEmployerPlan','designatedRoth'].includes(values.accountType))return false;}
 if(a==='dated-loan'){if(['originalPrincipal','originalMonths','paidMonths'].includes(key)&&values.balanceInput!=='original')return false;if(key==='knownMonthlyPayment'&&values.balanceInput!=='payment')return false;if(key==='principal'&&values.balanceInput&&values.balanceInput!=='current')return false;if(key==='months'&&values.balanceInput==='original')return false;}
 if(a==='biweekly-inferred'){if(key==='paidMonths'&&values.balanceInput!=='original')return false;if(['knownMonthlyPayment','remainingMonths'].includes(key)&&values.balanceInput!=='payment')return false;if(['principal','originalMonths'].includes(key)&&values.balanceInput==='payment')return false;}
 if(a==='retail-tax'){const pairs:Record<string,string[]>={'net-and-rate':['net','ratePercent'],'gross-and-rate':['gross','ratePercent'],'tax-and-rate':['tax','ratePercent'],'net-and-gross':['net','gross']};if(['net','gross','tax','ratePercent'].includes(key)&&!pairs[values.known]?.includes(key))return false;}
 if(a==='retail-discount'){const pairs:Record<string,string[]>={'original-and-rate':['original','discountPercent'],'final-and-rate':['final','discountPercent'],'saved-and-rate':['saved','discountPercent'],'original-and-saved':['original','saved']};if(['original','final','saved','discountPercent'].includes(key)&&!pairs[values.known]?.includes(key))return false;}
 if(a==='retail-margin'&&((['cost','revenue'].includes(key)&&values.known!=='cost-and-revenue')||(['profit','marginPercent'].includes(key)&&values.known!=='profit-and-margin')))return false;
 if(a==='rent-buy-streams'&&key==='annualTaxBenefit'&&values.taxBenefitMode!=='manual')return false;
 if(a==='semester-gpa'&&((key==='gradeScale'&&values.gradeFormat!=='letter')||(key==='percentScale'&&values.gradeFormat!=='percentage')))return false;
 if(['calendar-count','calendar-add'].includes(a)&&['holidayObservation','selectedHolidayRules'].includes(key)&&values.holidayPreset!=='us-federal-current')return false;
 if(a==='resistor-bands'&&((key==='c'&&Number(values.bandCount)<5)||(key==='tolerance'&&values.bandCount==='3')||(key==='temperatureCoefficient'&&values.bandCount!=='6')))return false;
 if(a==='ipv4-mask'&&((key==='mask'&&values.maskInput!=='dotted-mask')||(key==='prefix'&&values.maskInput==='dotted-mask')))return false;
 if(a==='tile-procurement'&&((['length','width'].includes(key)&&values.areaInput==='known-area')||(key==='area'&&values.areaInput!=='known-area')))return false;
 if(a==='shift-card'&&['threshold','multiplier'].includes(key)&&values.overtimeMode==='none')return false;
 if(a==='speed-units'){
  if(key==='speed'&&values.solve==='speed')return false;
  if(['duration','durationFormat'].includes(key)&&['time','convert'].includes(values.solve))return false;
  if(key==='distance'&&['distance','convert'].includes(values.solve))return false;
 }
 if(a==='random-exact' &&key==='places'&&values.kind==='integer')return false;
 if(a==='probability'&&key==='intersection'&&values.relation==='independent')return false;
 if(['nominal-tvm','vehicle-price'].includes(a)&&key===values.solve)return false;
 if(a==='refinance-horizon'){if(['originalPrincipal','originalMonths','elapsedMonths'].includes(key)&&values.existingInput!=='original-loan')return false;if(['remainingPrincipal','remainingMonths'].includes(key)&&values.existingInput==='original-loan')return false;if(key==='remainingPrincipal'&&values.existingInput==='payment-and-remaining-term')return false;if(key==='oldPayment'&&values.existingInput!=='payment-and-remaining-term')return false;}
 if(a==='rental-holding'&&((key==='salePrice'&&values.salePriceMode!=='known-price')||(['appreciationPercent','afterRepairValue'].includes(key)&&values.salePriceMode!=='appreciation')))return false;
 if(a==='tvm'&&key===values.solve)return false;
 if(a==='matrix'&&key==='b'&&!['add','subtract','multiply'].includes(values.operation))return false;
 if(a==='p-value'&&((key==='df'&&values.distribution==='normal')||(key==='df2'&&values.distribution!=='f')))return false;
 if(a==='speed'&&key===values.solve)return false;
 if(a==='body-fat'&&key==='hip'&&values.sex==='male')return false;
 if((a==='bmr'||a==='tdee'||a==='macro-energy')&&key==='fat'&&values.method!=='katch')return false;
 if(['density-inverse','molarity-inverse','dew-inverse','bandwidth-hosting','half-life-inverse'].includes(a)&&key===values.solve)return false;
 if(a==='log-inverse'&&((values.solve==='argument'&&key==='value')||(values.solve==='base'&&key==='base')))return false;
 if((a==='nth-sequence'||a==='sequence')&&values.kind==='fibonacci'&&['first','step'].includes(key))return false;
 if(a==='floor-shapes'){if(key==='angle'&&values.shape!=='sector')return false;if(key==='c'&&!['border','triangle','trapezoid'].includes(values.shape))return false;if(key==='b'&&values.shape==='sector')return false;}
 if(a==='heart-rate-methods'&&key==='maximum'&&values.equation!=='measured')return false;
 if(a==='proportion-all'&&key===values.solve)return false;
 if(a==='big-integer'&&key==='b'&&values.operation==='factorial')return false;
 if(a==='scientific-arithmetic'&&key==='b'&&['sqrt','square'].includes(values.operation))return false;
 if(a==='cap-inverse'&&((values.known==='base-height'&&key==='r')||(values.known==='sphere-base'&&key==='h')))return false;
 if(['financing-lease','simple-inverse','margin-target','commission-inverse'].includes(a)&&key===values.solve)return false;
 if(a==='matrix'&&((key==='scalar'&&values.operation!=='scale')||(key==='power'&&values.operation!=='power')))return false;
 return true;
}
