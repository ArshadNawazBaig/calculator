import {localizedPath, isTranslatedPage} from '@/lib/i18n/config';
import {describe, expect, it} from 'vitest';
import {calculate} from '@/lib/calculators/engine';
import {toolkitDefinitions} from '@/lib/calculators/toolkit-definitions';
import {calculateInvoice, splitExpenses} from '@/lib/calculators/toolkit-engine';
import {defaults, type Values} from '@/lib/calculators/types';
import {updateInputs} from '@/lib/calculators/input-display';
import {calculatorCurrencyPolicy} from '@/lib/calculators/currency-policy';
import {parseRecordCsv, csvCell} from '@/lib/calculators/record-csv';
import {getToolkitEditorial} from '@/lib/toolkit-editorial';
import {netWorthHistory} from '@/lib/workspace/net-worth';
import type {SavedCalculation} from '@/lib/workspace/model';
import {searchCalculators} from '@/lib/calculator-search';
import {toolMap} from '@/lib/calculators/registry';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {ToolkitSummary, ToolkitArticleData} from '@/components/content/toolkit-summary';

const definition = (slug: string) => toolkitDefinitions.find(item => item.slug === slug)!;
const modeFor = (slug: string, id?: string) => id ? definition(slug).modes.find(item => item.id === id)! : definition(slug).modes[0];
const valuesFor = (slug: string, patch: Values = {}) => ({...defaults(modeFor(slug)), ...patch});
async function run(slug: string, patch: Values = {}, id?: string) {
  const mode = modeFor(slug, id), result = await calculate(toolMap.get(slug)!.category, mode, {...defaults(mode), ...patch});
  return {...result, metric: Object.fromEntries(result.metrics.map(item => [item.label, item.value]))};
}

describe('freelance and invoice independently worked examples', () => {
  it('accounts for nonbillable time, tax reserve, and both buffers', async () => {
    const {metric: m} = await run('freelance-rate-calculator');
    expect(m['Annual revenue target']).toBeCloseTo(101200, 7);
    expect(m['Annual billable hours']).toBe(1104);
    expect(m['Required hourly rate']).toBeCloseTo(91.6666666667, 7);
    expect(m['Project quote']).toBeCloseTo(4216.666666667, 7);
  });
  it('rejects no billable capacity', async () => {await expect(run('freelance-rate-calculator', {billable:'0'})).rejects.toThrow(/Billable/);});
  it('applies discount before tax and subtracts an existing payment last', () => {
    const doc = calculateInvoice(valuesFor('invoice-generator', {discount:'10', tax:'8', shipping:'20', paid:'200'}));
    expect(doc).toMatchObject({subtotal:750, discount:75, tax:54, total:749, balance:549});
  });
  it('taxes shipping only when selected', () => {
    const doc = calculateInvoice(valuesFor('invoice-generator', {discount:'10', tax:'8', shipping:'20', paid:'200', taxShipping:'yes'}));
    expect(doc.tax).toBe(55.6); expect(doc.balance).toBe(550.6);
  });
  it('rounds each invoice line before summing, including half cents', () => {
    const doc = calculateInvoice(valuesFor('invoice-generator', {items:JSON.stringify([{description:'A', quantity:1, rate:.105},{description:'B', quantity:1, rate:.105}])}));
    expect(doc.subtotal).toBe(.22);
  });
  it.each([{items:'[]'}, {paid:'9999'}, {issueDate:'2026-02-30'}, {dueDate:'2026-09-01'}, {precision:'3'}] as Values[])('rejects invalid invoice inputs %j', patch => {
    expect(() => calculateInvoice(valuesFor('invoice-generator', patch))).toThrow();
  });
});

describe('processing fees and business contribution', () => {
  it('charges the fixed fee for each payment', async () => {
    const {metric: m} = await run('payment-fee-calculator', {transactions:'10'});
    expect(m['Fee per payment']).toBe(3.2); expect(m['Total processing fees']).toBe(32); expect(m['Total net receipts']).toBe(968);
  });
  it('finds the smallest rounded gross charge meeting the target', async () => {
    const result = await run('payment-fee-calculator', {solve:'gross'});
    expect(result.metric['Gross per payment']).toBe(103.3); expect(result.metric['Net per payment']).toBe(100);
    expect((await run('payment-fee-calculator', {amount:'103.29'})).metric['Net per payment']).toBe(99.99);
  });
  it('preserves small-payment losses and whole-unit rounding', async () => {
    expect((await run('payment-fee-calculator', {amount:'.1', rate:'0'})).metric['Net per payment']).toBe(-.2);
    const result = await run('payment-fee-calculator', {amount:'100', rate:'10', fixed:'0', precision:'0', solve:'gross'});
    expect(result.metric['Gross per payment']).toBe(111); expect(result.metric['Net per payment']).toBe(100); expect(result.table?.moneyDigits).toBe(0);
  });
  it('rejects fractional transaction counts and unsolvable fee rates', async () => {
    await expect(run('payment-fee-calculator', {transactions:'1.5'})).rejects.toThrow(/whole/);
    await expect(run('payment-fee-calculator', {rate:'100'})).rejects.toThrow();
  });
  it('limits platform presets to USD while custom models permit currency labels', () => {
    expect(calculatorCurrencyPolicy('payment-fee-calculator', modeFor('payment-fee-calculator', 'stripe-us'))).toEqual({kind:'fixed', currency:'USD'});
    expect(calculatorCurrencyPolicy('seller-profit-calculator', modeFor('seller-profit-calculator', 'etsy-us'))).toEqual({kind:'fixed', currency:'USD'});
    expect(calculatorCurrencyPolicy('seller-profit-calculator', modeFor('seller-profit-calculator'))).toEqual({kind:'selectable'});
  });
  it('finds whole-unit break-even and profit targets', async () => {
    const {metric: m} = await run('break-even-calculator');
    expect(m['Break-even whole units']).toBe(100); expect(m['Break-even sales revenue']).toBe(5000); expect(m['Units for target profit']).toBe(134); expect(m['Profit at planned sales']).toBe(1500); expect(m['Margin of safety']).toBeCloseTo(100/3, 7);
  });
  it('reports impossible contribution instead of a negative target', async () => {
    const {metric: m} = await run('break-even-calculator', {price:'10', variableCost:'20'});
    expect(m['Break-even whole units']).toBe('No positive contribution'); expect(m['Profit at planned sales']).toBe(-4500);
  });
  it('reconciles independently calculated per-order and monthly profit', async () => {
    const {metric: m} = await run('seller-profit-calculator');
    expect(m['Contribution per order']).toBe(23.32); expect(m['Monthly operating profit']).toBe(2132); expect(m['Platform and payment fees per order']).toBe(5.68);
  });
  it('keeps collected sales tax out of revenue but in processing fees', async () => {
    const {metric: m} = await run('seller-profit-calculator', {salesTax:'10'});
    expect(m['Monthly sales excluding collected tax']).toBe(5500); expect(m['Platform and payment fees per order']).toBe(5.98); expect(m['Monthly operating profit']).toBe(2102);
  });
  it('caps the US Etsy Offsite Ads example at 100 per order', async () => {
    const result = await run('seller-profit-calculator', {price:'2000', shippingCharged:'0', offsiteRate:'15'}, 'etsy-us');
    expect(result.table?.rows.find(row => row[0] === 'Percentage advertising fee')?.[1]).toBe(100);
  });
});

describe('household planning and history', () => {
  it('subtracts full mortgage liabilities once and separates liquid assets', async () => {
    const {metric:m} = await run('net-worth-tracker');
    expect(m['Net worth']).toBe(105000); expect(m['Total assets']).toBe(290000); expect(m['Liquid assets']).toBe(15000);
  });
  it('preserves negative net worth and supports an empty side of the balance sheet', async () => {
    const {metric:m} = await run('net-worth-tracker', {assets:'[]'});
    expect(m['Net worth']).toBe(-185000); expect(m['Debt-to-assets ratio']).toBe('Not defined without assets');
  });
  it('chooses latest saved corrections by date, and never combines currencies', () => {
    const snapshot = (id:string, date:string, createdAt:string, value:number, currency='USD') => ({id, name:id, title:'Net Worth Tracker', modeId:'snapshot', modeTitle:'Snapshot', inputs:[], labels:{}, currencyLabels:true, expressionAnswer:null, slug:'net-worth-tracker', algorithm:'toolkit-networth', values:{snapshotDate:date}, createdAt, currency, metrics:[{label:'Net worth',value}]} satisfies SavedCalculation);
    const points = netWorthHistory([snapshot('older','2026-10-01','2026-10-01T10:00:00Z',100),snapshot('corrected','2026-10-01','2026-10-01T11:00:00Z',90),snapshot('next','2026-11-01','2026-11-01T10:00:00Z',120),snapshot('eur','2026-10-01','2026-10-01T12:00:00Z',999,'EUR')], 'USD');
    expect(points.map(point => [point.id,point.value])).toEqual([['corrected',90],['next',120]]);
  });
  it('builds the emergency target and exact final deposit', async () => {
    const base = await run('emergency-fund-calculator');
    expect(base.metric['Emergency fund target']).toBe(15000); expect(base.metric['Months to goal']).toBe(20); expect(base.table?.rows.at(-1)).toEqual([20,500,15000]);
    const final = await run('emergency-fund-calculator', {saved:'13950'});
    expect(final.table?.rows.at(-1)).toEqual([3,50,15000]);
  });
  it('handles already funded and no-deposit emergency scenarios', async () => {
    expect((await run('emergency-fund-calculator', {saved:'20000', monthlySaving:'0'})).metric['Months to goal']).toBe(0);
    expect((await run('emergency-fund-calculator', {monthlySaving:'0'})).metric['Months to goal']).toBe('No progress without deposits');
  });
  it('models subscription cancellations and annual offers separately', async () => {
    const {metric:m} = await run('subscription-cost-tracker');
    expect(m['Current annual spending']).toBe(540); expect(m['Planned annual spending']).toBe(280); expect(m['Annual savings']).toBe(260);
  });
  it('distinguishes four-weekly from monthly costs and exposes a worse annual offer', async () => {
    const {metric:m} = await run('subscription-cost-tracker', {subscriptions:JSON.stringify([{name:'Four-weekly',cost:10,cycle:'four-weekly',action:'annual',annualOffer:150},{name:'Monthly',cost:10,cycle:'monthly',action:'keep',annualOffer:0}])});
    expect(m['Current annual spending']).toBe(250); expect(m['Annual savings']).toBe(-20);
  });
});

describe('group settlements conserve money', () => {
  it('settles the hotel and dinner example', () => {
    const data = splitExpenses(valuesFor('expense-splitter'));
    expect(data.total).toBe(240); expect(data.people.map(person => person.balance)).toEqual([100,-20,-80]);
    expect(data.settlements).toEqual([{from:'Sam',to:'Alex',amount:20},{from:'Jordan',to:'Alex',amount:80}]);
  });
  it('allocates a nondivisible amount without losing a cent', () => {
    const data = splitExpenses(valuesFor('expense-splitter', {expenses:JSON.stringify([{description:'Bill',payer:'Alex',amount:10,shares:''}])}));
    expect(data.people.map(person => person.owed)).toEqual([3.34,3.33,3.33]); expect(data.settlements.reduce((n,x)=>n+Math.round(x.amount*100),0)).toBe(666);
  });
  it('uses per-expense weighted subsets even when the payer is excluded', () => {
    const data = splitExpenses(valuesFor('expense-splitter', {expenses:JSON.stringify([{description:'Bill',payer:'Jordan',amount:90,shares:'Alex:2, Sam:1'}])}));
    expect(data.people.map(person => person.owed)).toEqual([60,30,0]); expect(data.people.map(person => person.balance)).toEqual([-60,-30,90]);
  });
  it.each(['Alex:1, Alex:2','Unknown:1','Alex:0','Alex:NaN'])('rejects malformed allocations: %s', shares => {
    expect(()=>splitExpenses(valuesFor('expense-splitter', {expenses:JSON.stringify([{description:'Bill',payer:'Alex',amount:10,shares}])}))).toThrow();
  });
  it('settles every resulting balance for varied small cent amounts', () => {
    for (const amount of [.01,.02,.07,1.01,9.99,100.01]) {
      const data=splitExpenses(valuesFor('expense-splitter',{expenses:JSON.stringify([{description:'Bill',payer:'Sam',amount,shares:'Alex:7, Sam:3, Jordan:2'}])}));
      const balances=new Map(data.people.map(person=>[person.name,Math.round(person.balance*100)]));
      for(const payment of data.settlements){balances.set(payment.from,balances.get(payment.from)!+Math.round(payment.amount*100));balances.set(payment.to,balances.get(payment.to)!-Math.round(payment.amount*100));}
      expect([...balances.values()]).toEqual([0,0,0]); expect(data.people.reduce((n,person)=>n+Math.round(person.owed*100),0)).toBe(Math.round(amount*100));
    }
  });
});

describe('cash, solar, and vehicle projections', () => {
  it('distinguishes fractional burn runway, zero-cash month, and buffer breach', async () => {
    const {metric:m}=await run('cash-flow-calculator');
    expect(m['Constant-burn runway']).toBeCloseTo(8.333333333,7); expect(m['First month cash reaches zero or below']).toBe(9); expect(m['First month below safety buffer']).toBe(7); expect(m['Ending cash balance']).toBe(-13200); expect(m['Funding needed to maintain buffer']).toBe(18200);
  });
  it('applies one-time financing only once', async () => {
    const {metric:m}=await run('cash-flow-calculator',{oneOffs:JSON.stringify([{month:6,description:'Funding',direction:'in',amount:10000}])});
    expect(m['Ending cash balance']).toBe(-3200); expect(m['First month cash reaches zero or below']).toBe(12);
  });
  it('rejects movements outside the forecast and fractional years', async () => {
    await expect(run('cash-flow-calculator',{oneOffs:JSON.stringify([{month:13,description:'Funding',direction:'in',amount:10000}])})).rejects.toThrow();
    await expect(run('solar-savings-calculator',{years:'2.5'})).rejects.toThrow(/whole/);
  });
  it('reconciles solar generation, export credit, maintenance and constant-benefit payback', async () => {
    const {metric:m,table}=await run('solar-savings-calculator',{degradation:'0'});
    expect(table?.rows[1].slice(1,5)).toEqual([7000,4200,2800,830]); expect(m['Unfinanced payback']).toBeCloseTo(15000/830,8); expect(m['Cumulative cash after financing']).toBe(5750);
  });
  it('caps on-site use by demand and retains a loan balance beyond the forecast', async () => {
    const limited=await run('solar-savings-calculator',{annualUse:'1000'});
    expect(limited.table?.rows[1].slice(2,4)).toEqual([1000,6000]);
    const {metric:m}=await run('solar-savings-calculator',{degradation:'0',financed:'5000',loanRate:'0',loanYears:'10',years:'5'});
    expect(m['Loan balance remaining']).toBeCloseTo(2500,7); expect(m['Cumulative cash after financing']).toBeCloseTo(-8350,7);
  });
  it('rejects financing or incentives above the underlying cost', async () => {
    await expect(run('solar-savings-calculator',{incentive:'15001'})).rejects.toThrow(/incentive/);
    await expect(run('solar-savings-calculator',{financed:'15001'})).rejects.toThrow(/financed/);
  });
  it('reconciles the full EV example including losses and final resale', async () => {
    const {metric:m,table}=await run('ev-vs-petrol-calculator');
    expect(m['EV grid energy per year']).toBe(3000); expect(m['EV annual charging cost']).toBeCloseTo(600,8); expect(m['Petrol annual fuel cost']).toBe(1575);
    expect(m['EV total ownership cost']).toBe(32000); expect(m['Petrol total ownership cost']).toBe(33375); expect(m['EV savings over ownership period']).toBe(1375); expect(m['Simple running-cost payback']).toBeCloseTo(8000/1275,8);
    expect(table?.rows[0]).toEqual([0,36000,28000,-8000]); expect(table?.rows[4][1]).toBe(44800);
  });
  it('preserves vehicle costs when switching metric inputs to US units and back', async () => {
    const mode=modeFor('ev-vs-petrol-calculator'), input=defaults(mode), us=updateInputs(mode,input,'units','us'), metric=updateInputs(mode,us,'units','metric');
    expect((await run('ev-vs-petrol-calculator',us)).metric['EV savings over ownership period']).toBeCloseTo(1375,5);
    for(const key of ['distance','evEfficiency','fuelEfficiency','fuelPrice'])expect(Number(metric[key])).toBeCloseTo(Number(input[key]),6);
  });
});

describe('CSV rows and discoverable original guides', () => {
  it('keeps the selected language and preserves local saved links', () => {
    expect(localizedPath('/es/invoice-generator#saved=test', 'fr')).toBe('/fr/invoice-generator#saved=test');
    expect(isTranslatedPage('/invoice-generator')).toBe(true);
  });
  const columns=[{key:'name',label:'Name',default:''},{key:'amount',label:'Amount',default:'0'}];
  it('imports quoted commas, line breaks, and escaped quotation marks', () => {
    expect(JSON.parse(parseRecordCsv('\uFEFFname,amount\r\n"A, B",12\r\n"Two\nlines ""quoted""",0',columns))).toEqual([{name:'A, B',amount:'12'},{name:'Two\nlines "quoted"',amount:'0'}]);
  });
  it.each(['name,name\nA,1','name,amount\n"unfinished,1','name,amount\nA,1,extra','name,amount\n"A"oops,1'])('rejects damaged CSV without accepting partial data', text => {expect(()=>parseRecordCsv(text,columns)).toThrow();});
  it('rejects excessive CSV rows', () => {expect(()=>parseRecordCsv('name,amount\n'+Array.from({length:101},()=> 'A,1').join('\n'),columns)).toThrow(/100/);});
  it('escapes spreadsheet formulas without changing negative numeric cells', () => {
    expect(csvCell('=HYPERLINK("https://example.com")')).toBe('"\'=HYPERLINK(""https://example.com"")"'); expect(csvCell('-12.5')).toBe('"-12.5"'); expect(csvCell(' @SUM(A1)')).toBe('"\' @SUM(A1)"');
  });
  it.each(toolkitDefinitions.map(tool=>[tool.slug]))('provides substantial visible guidance and valid article data for %s', slug => {
    const entry=getToolkitEditorial(slug)!, def=definition(slug);
    expect(entry.sections).toHaveLength(4); expect(entry.faqs).toHaveLength(6);
    expect([entry.quickAnswer,...entry.sections.flatMap(section=>section.paragraphs),...entry.faqs.flatMap(faq=>[faq.question,faq.answer])].join(' ').split(/\s+/).length).toBeGreaterThan(600);
    expect(entry.seoTitle.length).toBeLessThan(81); expect(entry.description.length).toBeLessThan(181);
    const html=renderToStaticMarkup(createElement(ToolkitSummary,{slug})); expect(html).toContain('quick-answer-heading'); expect(html).toContain('href="#common-questions"');
    const structured=renderToStaticMarkup(createElement(ToolkitArticleData,{definition:def})); expect(structured).toContain('"@type":"Article"'); expect(structured).toContain('"@type":"Question"'); expect(structured).toContain(`"dateModified":"${entry.reviewedAt}"`);
    expect(searchCalculators(toolMap.get(slug)!.title)[0].slug).toBe(slug);
  });
  it.each([['stripe','payment-fee-calculator'],['etsy profit','seller-profit-calculator'],['gasoline','ev-vs-petrol-calculator'],['rainy day','emergency-fund-calculator']])('finds %s by a useful synonym', (query,slug) => {expect(searchCalculators(query).map(tool=>tool.slug)).toContain(slug);});
});
