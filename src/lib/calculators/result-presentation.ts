import type {Result} from './types';

export type ChartPoint = {x: number; label: string; values: number[]};
export type SeriesChart = {title: string; xLabel: string; labels: string[]; points: ChartPoint[]};
export type BreakdownChart = {title: string; description: string; items: {label: string; value: number}[]};
type SeriesRule = {title: string; columns: string[]; moneyFrom: number; exclude?: number[]};
const rules: Record<string, SeriesRule> = {};
for (const algorithm of ['loan','payoff','mortgage','mortgage-ca','mortgage-uk','auto-loan','refinance','consolidation','student-loan','program-loan']) {
  rules[algorithm] = {title:'Loan balance over time', columns:['Balance ($)'], moneyFrom:2};
}
rules['dated-loan'] = {title:'Loan balance over time', columns:['Ending balance'], moneyFrom:2};
rules['growth'] = {title:'Savings over time', columns:['Balance ($)','Contributions ($)'], moneyFrom:1};
rules['dual-contributions'] = {title:'Savings over time', columns:['Balance'], moneyFrom:1};
rules['debt-payoff'] = {title:'Debt balance over time', columns:['Remaining balance ($)'], moneyFrom:1};
rules['debt-budget-ledger'] = {title:'Debt balance over time', columns:['Ending balance'], moneyFrom:2};
rules['depreciation'] = {title:'Asset value over time', columns:['Book value ($)'], moneyFrom:1};
rules['book-depreciation'] = {title:'Asset value over time', columns:['Ending book value'], moneyFrom:3};
rules['retire-salary'] = {title:'Retirement balance over time', columns:['Scenario ending balance'], moneyFrom:2};
rules['ownership-lines'] = {title:'Ownership costs over time', columns:['Total annual costs'], moneyFrom:1};
rules['salary-401k'] = {title:'Retirement balance over time', columns:['Ending balance'], moneyFrom:2};
rules['college-share'] = {title:'Savings over time', columns:['Ending balance'], moneyFrom:1};
rules['consolidation-fee-comparison'] = {title:'Debt balance over time', columns:['Remaining principal'], moneyFrom:1};
rules['program-policy'] = {title:'Loan balance over time', columns:['Ending principal'], moneyFrom:1};
rules['heloc-fees'] = {title:'Loan balance over time', columns:['Ending principal'], moneyFrom:2};
rules['owner-rmd'] = {title:'Retirement balance over time', columns:['Projected year-end balance'], moneyFrom:2, exclude:[3]};
rules['rent-buy-streams'] = {title:'Ownership costs over time', columns:['Rent and renter insurance','Buyer cash housing costs'], moneyFrom:1};

/** Visualize existing engine output only; never invent samples or recalculate a financial model. */
export function resultPresentation(result: Result, algorithm = '') {
  const rule = Object.hasOwn(rules, algorithm) ? rules[algorithm] : undefined;
  const table = result.table;
  let series: SeriesChart | undefined;
  const moneyColumns = table?.headers.flatMap((header,index) => /\(\$\)/.test(header) ? [index] : []) ?? [];
  if (rule && table) {
    const indices = rule.columns.map(column => table.headers.indexOf(column));
    if (indices.every(index => index >= 0)) {
      for(let index=rule.moneyFrom;index<table.headers.length;index++) if(!rule.exclude?.includes(index) && !moneyColumns.includes(index)) moneyColumns.push(index);
      const points = table.rows.map(row => ({
        x: typeof row[0] === 'number' ? row[0] : /^\d{4}-\d{2}-\d{2}$/.test(String(row[0])) ? Date.parse(String(row[0])+'T00:00:00Z') : NaN,
        label: String(row[0]), values: indices.map(index => row[index]),
      }));
      if (points.length > 1 && points.every((point,index) => Number.isFinite(point.x) && (!index || point.x > points[index-1].x) && point.values.every(value => typeof value === 'number' && Number.isFinite(value)))) {
        series = {title:rule.title, xLabel:table.headers[0], labels:rule.columns.map(label=>label.replace(' ($)','')), points:points as ChartPoint[]};
      }
    }
  }
  let breakdown: BreakdownChart | undefined;
  if (result.chart?.length && result.chart.every(item=>Number.isFinite(item.value))) {
    const items = result.chart.map(item=>({...item}));
    // Older engine chart data clips negative growth; the authoritative result metric does not.
    if (algorithm === 'growth') {
      const gain = result.metrics.find(metric=>metric.label==='Growth after modeled tax');
      const item = items.find(item=>item.label==='Growth');
      if (item && typeof gain?.value === 'number' && Number.isFinite(gain.value)) item.value = gain.value;
    }
    const budgetLabels: Record<string,string> = {housing:'Housing',utilities:'Utilities',food:'Food',transport:'Transport',insurance:'Insurance',debt:'Debt',savings:'Savings',other:'Other'};
    if(algorithm==='budget') for(const item of items) if(Object.hasOwn(budgetLabels,item.label))item.label=budgetLabels[item.label];
    const loan = items.length === 2 && items.some(item=>item.label==='Principal') && items.some(item=>item.label==='Interest');
    breakdown = {
      title:algorithm==='budget'?'Monthly allocation':algorithm==='growth'?'Contributions and growth':loan?'Loan payment breakdown':'Result breakdown',
      description:algorithm==='budget'?'Your entered spending and savings allocations.':algorithm==='growth'?'Contributions and net growth in the projection.':loan?'Principal and interest over the loan term.':'The amounts that make up your result.', items,
    };
  }
  return {series, breakdown, moneyColumns};
}

/** A normalized domain stays finite even for very large positive and negative results. */
export function chartDomain(values: number[]) {
  let magnitude = 0;
  for(const value of values) if(Number.isFinite(value))magnitude=Math.max(magnitude,Math.abs(value));
  magnitude ||= 1;
  let min = 0, max = 0;
  for(const value of values) if(Number.isFinite(value)){min=Math.min(min,value/magnitude);max=Math.max(max,value/magnitude);}
  if(min===max)max=min+1;
  return {min,max,magnitude,position:(value:number)=>(value/magnitude-min)/(max-min)};
}
