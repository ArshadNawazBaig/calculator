import {describe,it,expect} from 'vitest';
import fixtures from './fixtures/finance-expansion-reference.json';
import {definitions} from '@/lib/calculators/registry';
import {defaults,type Values} from '@/lib/calculators/types';
import {calculate} from '@/lib/calculators/engine';
const labels:Record<string,string>={pv:'Present cash flow',fv:'Future cash flow',payment:'Payment cash flow',periods:'Payment periods',nominalRatePercent:'Nominal annual rate',periodicRatePercent:'Periodic rate',endingBalance:'Ending balance',totalContributions:'Contributions after opening balance',netInvestmentGain:'Net investment gain',taxPaid:'Tax paid',realEndingBalance:'Inflation-adjusted balance',exitLoads:'Exit load',endingAfterAllFees:'Ending after all fees',frontLoads:'Front loads',operatingExpenses:'Operating expenses',endingBeforeExitLoad:'Ending before exit load',directFees:'Direct fees',noFeeEndingBalance:'No-fee ending balance',totalFeeImpact:'Total fee impact',grossCashSupplied:'Gross cash supplied',salesTax:'Sales tax',financedPrincipal:'Financed principal',upfrontCash:'Upfront cash',sellingPrice:'Selling price',leaseAdjustedCapCost:'Adjusted capitalized cost',preTaxPayment:'Pre-tax payment'};
type Fixture={id:string;gap:string;inputs:Record<string,unknown>;expected?:Record<string,unknown>;expectedError?:string};
describe('Independent finance expansion references',()=>{for(const f of (fixtures as Fixture[]).filter(f=>['F04','F06','F07','F08'].includes(f.gap)))it(f.id,async()=>{
 const [slug,id]=f.gap==='F04'?['finance-calculator','nominal-tvm']:f.gap==='F06'?['investment-calculator','dual-streams']:f.gap==='F07'?['mutual-fund-calculator',f.inputs.mode==='exit-load-only'?'exit-load':'loads']:f.inputs.solve==='lease-price'?['auto-lease-calculator','reverse-price']:['auto-loan-calculator','reverse-price'];
 const mode=definitions.find(d=>d.slug===slug)!.modes.find(m=>m.id===id)!;expect(mode).toBeDefined();const values:Values=defaults(mode);
 // Unspecified assumptions in these independent fixtures are zero, not illustrative UI examples.
 for(const key of ['annualContributionGrowthPercent','monthlyContributionGrowthPercent','taxRatePercent','inflationPercent','frontLoadPercent','expenseRatioPercent','deferredLoadPercent'])if(key in values)values[key]='0';
 for(const [key,value] of Object.entries(f.inputs))values[key]=typeof value==='object'?JSON.stringify(value):typeof value==='boolean'?(value?'yes':'no'):String(value);
 if(f.expectedError){await expect(calculate('finance',mode,values)).rejects.toThrow();return;}
 const output=await calculate('finance',mode,values),metrics=Object.fromEntries(output.metrics.map(m=>[m.label,m.value]));
 for(const [key,expected] of Object.entries(f.expected||{})){const label=key==='payment'&&f.gap==='F08'?'Monthly payment':labels[key];expect(metrics[label],key).toBeDefined();expect(Number(metrics[label]),key).toBeCloseTo(Number(expected),5);}
 });});
