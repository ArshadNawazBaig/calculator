import {describe,expect,it} from 'vitest';
import {definitionMap,catalog} from '@/lib/calculators/registry';
import {calculate} from '@/lib/calculators/engine';
import {defaults,type Values} from '@/lib/calculators/types';
import content from '@/data/calculator-content.json';

async function metrics(slug:string,id:string,inputs:Values) {
  const mode=definitionMap.get(slug)!.modes.find(mode=>mode.id===id)!;
  const result=await calculate(catalog.find(tool=>tool.slug===slug)!.category,mode,{...defaults(mode),...inputs});
  return Object.fromEntries(result.metrics.map(metric=>[metric.label,metric.value]));
}
describe('published editorial examples and regional assumptions',()=>{
  it('matches every figure in the mortgage breakdown to its amount or payment period', async () => {
    const price = 300000, down = 20, annualTax = 2400, annualInsurance = 1200;
    const result = await metrics('mortgage-calculator', 'repayment', {
      price: String(price), down: String(down), rate: '6', years: '30',
      tax: String(annualTax), insurance: String(annualInsurance), pmi: '0', hoa: '0', other: '0',
    });
    const rows = content['mortgage-calculator'].sections[1].table!.rows;
    const amounts = Object.fromEntries(rows.map(([label, , amount]) => [label, Number(amount.replaceAll(',', ''))]));
    expect(rows[0][1]).toBe('300,000 × 0.20');
    expect(amounts['Down payment']).toBe(price * down / 100);
    expect(amounts['Loan principal']).toBe(result['Loan amount']);
    expect(amounts['Principal and interest']).toBeCloseTo(Number(result['Regular monthly payment']), 2);
    expect(amounts['Property tax']).toBe(annualTax / 12);
    expect(amounts['Insurance']).toBe(annualInsurance / 12);
    expect(amounts['Initial monthly total']).toBeCloseTo(Number(result['Initial monthly ownership cost']), 2);
  });

  it('reconciles the opening 401(k) balance, both deposits and earnings to the displayed ending balance', async () => {
    const result = await metrics('401k-calculator', 'growth', {
      balance: '10000', contribution: '2000', employer: '1000', rate: '5', years: '5', tax: '20',
    });
    const rows = content['401k-calculator'].sections[1].table!.rows;
    const amounts = Object.fromEntries(rows.map(([label, amount]) => [label, Number(amount.replaceAll(',', ''))]));
    const employee = amounts['Employee deposits over five years'], employer = amounts['Employer deposits over five years'];
    expect(employee).toBe(5 * 2000);
    expect(employer).toBe(5 * 1000);
    expect(amounts['Five years of combined contributions']).toBe(employee + employer);
    const deposits = amounts['Starting balance'] + employee + employer;
    expect(deposits).toBe(result['Total contributions']);
    expect(amounts['Projected investment earnings over five years']).toBeCloseTo(Number(result['Projected account balance']) - deposits, 2);
    expect(amounts['Projected account balance']).toBeCloseTo(Number(result['Projected account balance']), 2);
    expect(amounts['Illustrative value after 20% tax']).toBeCloseTo(Number(result['Illustrative after-tax balance']), 2);
  });

  it('reproduces every printed BMI using its own weight and height', async () => {
    const rows = content['bmi-calculator'].sections[1].table!.rows;
    for (const [weight, height, printed] of rows) {
      const kg = parseFloat(weight), cm = parseFloat(height);
      const result = await metrics('bmi-calculator', 'adult', {weight: String(kg), height: String(cm), units: 'metric', age: '30'});
      expect(printed).toBe((kg / (cm / 100) ** 2).toFixed(2));
      expect(printed).toBe(Number(result['Body mass index']).toFixed(2));
    }
  });

  it.each([
    ['25','0','0',90], ['20','10','0',86], ['20','10','8',92.88], ['25','0','8',97.20],
  ])('checks the discount guide offer at %s%% with coupon %s and tax %s', async(rate,fixed,tax,price)=>{
    const result=await metrics('discount-calculator','calculate',{price:'120',rate,fixed,tax});
    expect(result['Final price with tax']).toBeCloseTo(price,8);
  });
  it('reproduces reversed coupon order and successive discounts',async()=>{
    const couponFirst=await metrics('discount-calculator','calculate',{price:'110',rate:'20',fixed:'0',tax:'0'});
    expect(couponFirst['Price before tax']).toBe(88);
    const successive=await metrics('discount-calculator','calculate',{price:'96',rate:'10',fixed:'0',tax:'0'});
    expect(successive['Price before tax']).toBeCloseTo(86.4,8);
  });
  it('distinguishes an ungraded final from a scored zero in the grade guide',async()=>{
    const rows=[{name:'Homework',weight:30,score:90},{name:'Midterm',weight:40,score:80},{name:'Final exam',weight:30,score:'',plannedScore:90}];
    const ungraded=await metrics('grade-calculator','categories',{categories:JSON.stringify(rows)});
    expect(ungraded['Current weighted grade']).toBeCloseTo(84.28571428571429,10);
    expect(ungraded['Graded course weight']).toBe(70);
    expect(ungraded['Projected course grade']).toBe(86);
    rows[2].score=0;
    const zero=await metrics('grade-calculator','categories',{categories:JSON.stringify(rows)});
    expect(zero['Current weighted grade']).toBe(59);
  });
  it.each([[80,70],[85,86.66666666666667],[90,103.33333333333333]])('checks the grade guide target of %s',async(target,required)=>{
    const result=await metrics('final-exam-grade-calculator','final',{current:String(59/.7),target:String(target),weight:'30'});
    expect(result['Required final score']).toBeCloseTo(required,8);
    expect(result['Highest possible overall grade']).toBe(89);
  });
  it.each([['4','0',2.469135802469136],['4','5',2.592592592592593],['4','10',2.7160493827160495],['4.5','0',2.777777777777778]])('checks the concrete guide at %s inches and %s%% allowance',async(depth,waste,volume)=>{
    const result=await metrics('concrete-calculator','slab',{length:'20',width:'10',depth,waste});
    expect(result['With allowance']).toBeCloseTo(volume,10);
  });
  it.each([['ordered',434.5679012345679],['net',395.0617283950617]])('prices concrete using the guide’s %s basis',async(priceBasis,cost)=>{
    const result=await metrics('concrete-calculator','measured',{shape:'slab',length:'20',lengthUnit:'ft',width:'10',widthUnit:'ft',depth:'4',depthUnit:'in',quantity:'1',waste:'10',price:'160',priceVolumeUnit:'yd3',priceBasis});
    expect(result['Material cost']).toBeCloseTo(cost,8);
  });
  // Independently evaluated annuity formulas; see docs/growth-quality-2026-10-11.md.
  it.each([['end',2395.07533145183],['beginning',2407.75783446503]])('checks monthly deposits at period %s',async(timing,balance)=>{
    const result=await metrics('compound-interest-calculator','growth',{initial:'1000',contribution:'100',rate:'12',years:'1',frequency:'12',contributionFrequency:'12',timing:String(timing),taxRate:'0',inflation:'0'});
    expect(result['Projected balance']).toBeCloseTo(Number(balance),7);
    expect(result['Total contributions']).toBe(2200);
  });
  it('uses semiannual nominal compounding for a Canadian mortgage',async()=>{
    const result=await metrics('canadian-mortgage-calculator','repayment',{price:'300000',down:'0',rate:'5',years:'25',tax:'0',insurance:'0',pmi:'0',hoa:'0',other:'0',extra:'0',extraAnnual:'0',oneTime:'0'});
    expect(result['Regular monthly payment']).toBeCloseTo(1744.81495511105,7);
  });
  it('retains the principal in the UK interest-only example',async()=>{
    const result=await metrics('mortgage-calculator-uk','interest-only',{principal:'250000',rate:'5',years:'25'});
    expect(result['Monthly interest-only payment']).toBeCloseTo(1041.66666666667,7);
    expect(result['Principal due at term end']).toBe(250000);
    expect(result['Interest over the term']).toBe(312500);
  });
  it('undoes a 20% discount from the original base',async()=>{
    const result=await metrics('percent-calculator','reverse',{final:'80',change:'-20'});
    expect(result['Original value']).toBe(100);
  });
  it('clamps a month addition to the last day in leap-year February',async()=>{
    const result=await metrics('date-calculator','add',{start:'2024-01-31',years:'0',months:'1',weeks:'0',days:'0'});
    expect(result['Result date']).toBe('2024-02-29');
  });
  it('describes the second RMD deadline even when viewing a later distribution year',async()=>{
    const result=await metrics('rmd-calculator','calendar',{birthDate:'1948-01-01',distributionYear:'2023'});
    expect(result['First distribution year']).toBe(2018);
    expect(result['First RMD latest deadline']).toBe('2019-04-01');
    expect(result['Second RMD deadline']).toBe('2019-12-31');
    expect(result).not.toHaveProperty('Next RMD deadline');
  });
});
