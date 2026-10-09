import {expect,it} from 'vitest';
import {cashflowRoots} from '@/lib/calculators/cashflow-returns';
import {runGrowthFinance} from '@/lib/calculators/finance-growth-engine';
import {runPlanningFinance} from '@/lib/calculators/finance-planning-engine';
it('isolates a double IRR root and two nearby roots',()=>{
 const solve=(flows:number[])=>cashflowRoots(flows.map((amount,time)=>({time,amount}))).roots;
 const double=solve([-100,220,-121]);expect(double).toHaveLength(1);expect(double[0]).toBeCloseTo(.1,7);
 const nearby=solve([-100,220.1,-121.11]);expect(nearby).toHaveLength(2);expect(nearby[0]).toBeCloseTo(.1,7);expect(nearby[1]).toBeCloseTo(.101,7);
});
it('does not tax-refund a loss under the annual-interest model',()=>{
 const result=runPlanningFinance('equal-cost-ira',{annualPretaxBudget:'100',currentTaxPercent:'0',retirementTaxPercent:'0',annualReturnPercent:'-50',years:'2',initialTraditionalBalance:'0',initialRothBalance:'0',taxableAnnualTaxPercent:'50',timing:'end'});
 expect(result.metrics.find(m=>m.label==='Taxable account balance')!.value).toBe(150);
});
it('solves zero-rate TVM without accepting the multiplication-created root',()=>{
 const values={pv:'-1000',fv:'1200',payment:'-100',periods:'2',paymentsPerYear:'1',compoundsPerYear:'1',nominalRatePercent:'5',timing:'end',solve:'nominalRatePercent'};
 expect(Number(runGrowthFinance('nominal-tvm',values).metrics[0].value)).toBeCloseTo(0,6);
 expect(Number(runGrowthFinance('nominal-tvm',{...values,fv:'1662',periods:'3'}).metrics[0].value)).toBeCloseTo(10,6);
});
