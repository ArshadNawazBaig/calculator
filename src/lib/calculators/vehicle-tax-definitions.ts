import policy from '@/data/vehicle-tax-2026.json';
import {n, s, mode, type Mode} from './types';
const cash = (key: string, label: string, value = 0) => n(key, label, value, '$', 0);
const yn = [['no', 'No'], ['yes', 'Yes']] as [string, string][];
export function vehicleTaxDefinitions(): Record<string, Mode[]> {
  const vehicle = mode('state-tax-financing', 'US state tax treatment and offer comparison', 'vehicle-state-tax', [
    s('solve', 'Calculate', [['payment','Payment from vehicle price'],['price','Vehicle price from payment'],['compare','Rebate versus promotional rate']]), cash('price','Price after dealer discounts',35000), cash('payment','Monthly payment budget',600), n('nominalAprPercent','APR with rebate',6,'%',0,100), n('promotionalAprPercent','Promotional APR without rebate',2,'%',0,100), n('months','Monthly loan payments',60,undefined,1,1200), s('downType','Down payment type',[['amount','Cash amount'],['percent','Percent of price']]), n('down','Down payment',5000,undefined,0), cash('trade','Gross trade allowance',5000), cash('tradeDebt','Trade loan payoff',2000), cash('rebate','Manufacturer rebate applied to purchase',2000),
    ...[
      s('state','State or District of Columbia',policy.states.map(state=>[state.state,state.name]),'TX'),
      s('taxMethod','Tax method',[['manual','My verified taxable-base assumptions'],['state','2026 state preset, within stated scope'],['quoted','Actual quoted tax amount']]),
      n('taxYear','Rule year',2026,undefined,2026,2026), s('condition','Purchased vehicle condition',[['new','New passenger vehicle'],['used','Used passenger vehicle']]),
      s('scopeConfirmed','Ordinary dealer transaction and listed state conditions verified',yn), s('tradeEligible','Trade ownership, vehicle class and same-sale eligibility verified',yn,'yes'), s('rebateEligible','Rebate meets the state’s qualifying assignment or payment rule',yn,'yes'),
      s('tradeTaxCredit','My verified rule deducts trade allowance',yn,'yes'),s('rebateTaxCredit','My verified rule deducts manufacturer rebate',yn,'yes'),n('salesTaxPercent','Applicable tax rate (no automatic local lookup)',6,'%',0,100),cash('quotedTax','Actual tax or vehicle fee — rebate offer',1680),cash('promotionalQuotedTax','Actual tax or vehicle fee — promotional offer',1800),cash('taxableFees','Taxable dealer fees',200),cash('governmentFees','Nontaxable registration and government fees',300),s('financeTaxAndFees','Finance purchase tax and all entered fees',yn,'yes'),
    ].map(field=>({...field,group:'Vehicle tax and purchase fees'})),
  ], 'Taxable base = max(0, price + taxable fees − eligible trade deduction − eligible rebate); financing includes price, payoff, credits and financed costs.', 'Current scoped dealer-purchase rules for all 50 states and DC are available as source notes. A subset supports automatic base treatment; special or unresolved cases use an actual quoted tax amount. State choice does not determine a local rate.');
  return {'auto-loan-calculator':[vehicle], 'cash-back-or-low-interest-calculator':[{...vehicle,fields:vehicle.fields.map(f=>f.key==='solve'?{...f,default:'compare'}:f)}]};
}
