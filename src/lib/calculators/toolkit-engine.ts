import Decimal from 'decimal.js';
import {parseRows, rowNumber} from './row-data';
import {metric, type Result, type Values} from './types';

const money = (label: string, value: number | string) => metric(label, value, 'money');
const rounded = (value: Decimal.Value, precision = 2) => new Decimal(value).toDecimalPlaces(precision, Decimal.ROUND_HALF_UP).toNumber();
const sum = (values: number[]) => values.reduce((total, value) => total.plus(value), new Decimal(0)).toNumber();
const numeric = (v: Values, key: string, min = 0, max = 1e12) => rowNumber(v[key], key, min, max);
const whole = (value: number, label: string) => {if (!Number.isInteger(value)) throw Error(`${label} must be a whole number.`); return value;};
const rowText = (value: unknown, label: string, optional = false) => {
  if (typeof value !== 'string' || value.length > 2000 || !optional && !value.trim()) throw Error(`${label} needs text of at most 2,000 characters.`);
  return value.trim();
};
export function toolkitDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value + 'T00:00:00Z')) || new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) !== value) throw Error(`${label} must be a valid calendar date.`);
  return value;
}
const precisionOf = (v: Values) => {const p = Number(v.precision); if (![0, 2].includes(p)) throw Error('Choose a supported amount precision.'); return p;};
const amountRows = (v: Values, key: string, label: string) => parseRows(v[key], label).map((row, index): Record<string, unknown> & {name: string; amount: number} => ({...row, name: rowText(row.name, `${label} row ${index + 1} name`), amount: rowNumber(row.amount, `${label} row ${index + 1} amount`, 0, 1e12)}));

export type InvoiceDocument = {
  type: string; number: string; business: string; businessDetails: string; customer: string; customerDetails: string;
  issueDate: string; dueDate: string; terms: string; precision: number;
  items: {description: string; quantity: number; rate: number; total: number}[];
  subtotal: number; discount: number; shipping: number; tax: number; total: number; paid: number; balance: number;
};
export function calculateInvoice(v: Values): InvoiceDocument {
  const precision = precisionOf(v), round = (value: Decimal.Value) => rounded(value, precision);
  if (!['invoice', 'quotation'].includes(v.documentType)) throw Error('Choose an invoice or quotation.');
  const issueDate = toolkitDate(v.issueDate, 'Issue date'), dueDate = toolkitDate(v.dueDate, 'Due date');
  if (dueDate < issueDate) throw Error('The due date or validity date cannot precede the issue date.');
  const items = parseRows(v.items, 'Line items').map((row, index) => {
    const quantity = rowNumber(row.quantity, `Line ${index + 1} quantity`, .000001, 1e9), rate = rowNumber(row.rate, `Line ${index + 1} price`, 0, 1e12);
    return {description: rowText(row.description, `Line ${index + 1} description`), quantity, rate, total: round(new Decimal(quantity).times(rate))};
  });
  if (!items.length) throw Error('Add at least one line item.');
  const subtotal = sum(items.map(item => item.total));
  const discount = round(new Decimal(subtotal).times(numeric(v, 'discount', 0, 100)).div(100));
  const shipping = round(numeric(v, 'shipping'));
  const taxBase = new Decimal(subtotal).minus(discount).plus(v.taxShipping === 'yes' ? shipping : 0);
  const tax = round(taxBase.times(numeric(v, 'tax', 0, 100)).div(100));
  const total = round(new Decimal(subtotal).minus(discount).plus(shipping).plus(tax)), paid = round(numeric(v, 'paid'));
  if (paid > total) throw Error('Amount already paid cannot exceed the document total.');
  return {type: v.documentType === 'invoice' ? 'Invoice' : 'Quotation', number: rowText(v.documentNumber, 'Document number'), business: rowText(v.business, 'Business name'), businessDetails: rowText(v.businessDetails, 'Business details', true), customer: rowText(v.customer, 'Customer name'), customerDetails: rowText(v.customerDetails, 'Customer details', true), issueDate, dueDate, terms: rowText(v.terms, 'Terms', true), precision, items, subtotal, discount, shipping, tax, total, paid, balance: round(new Decimal(total).minus(paid))};
}

function freelance(v: Values): Result {
  const tax = numeric(v, 'taxReserve', 0, 99) / 100, hours = (52 - numeric(v, 'weeksOff', 0, 51)) * numeric(v, 'hours', .1, 168) * numeric(v, 'billable', 0, 100) / 100;
  if (hours <= 0) throw Error('Billable time must be greater than zero.');
  const income = numeric(v, 'income'), expenses = numeric(v, 'expenses'), pretax = income / (1 - tax), base = pretax + expenses, buffer = base * numeric(v, 'buffer', 0, 100) / 100, revenue = base + buffer, rate = revenue / hours;
  return {metrics: [money('Required hourly rate', rate), money('Quoted day rate', rate * numeric(v, 'dayHours', .1, 24)), money('Project quote', rate * numeric(v, 'projectHours', 0, 1e5) * (1 + numeric(v, 'scopeBuffer', 0, 100) / 100)), money('Annual revenue target', revenue), metric('Annual billable hours', hours), money('Planned annual tax reserve before buffer', pretax - income)], chart: [{label: 'Personal income', value: income}, {label: 'Planning tax reserve', value: pretax - income}, {label: 'Business expenses', value: expenses}, {label: 'Revenue buffer', value: buffer}], notes: ['Rates are planning targets before payment-processing fees. The tax reserve is an assumption, not an estimate under a specific country’s tax law.']};
}

function payment(v: Values, stripe: boolean): Result {
  const precision = stripe ? 2 : precisionOf(v), factor = new Decimal(10).pow(precision), rate = new Decimal(stripe ? 2.9 : numeric(v, 'rate', 0, 99)).div(100), fixed = new Decimal(stripe ? .3 : numeric(v, 'fixed'));
  const requested = new Decimal(numeric(v, 'amount')).toDecimalPlaces(precision, Decimal.ROUND_HALF_UP), count = whole(numeric(v, 'transactions', 1, 10000), 'Number of payments');
  const feeFor = (gross: Decimal) => gross.times(rate).plus(fixed).toDecimalPlaces(precision, Decimal.ROUND_HALF_UP);
  let gross = requested;
  if (v.solve === 'gross') {
    gross = requested.plus(fixed).div(new Decimal(1).minus(rate)).times(factor).ceil().div(factor);
    const step = new Decimal(1).div(factor);
    while (gross.minus(feeFor(gross)).lessThan(requested)) gross = gross.plus(step);
    while (gross.greaterThanOrEqualTo(step) && gross.minus(step).minus(feeFor(gross.minus(step))).greaterThanOrEqualTo(requested)) gross = gross.minus(step);
  } else if (v.solve !== 'net') throw Error('Choose net receipts or a target net amount.');
  const fee = feeFor(gross), net = gross.minus(fee);
  return {metrics: [money('Gross per payment', gross.toNumber()), money('Fee per payment', fee.toNumber()), money('Net per payment', net.toNumber()), money('Total processing fees', fee.times(count).toNumber()), money('Total net receipts', net.times(count).toNumber()), metric('Effective fee rate', gross.isZero() ? 'Not defined for zero gross' : fee.div(gross).times(100).toNumber(), 'percent')], table: {headers: ['Payments', 'Gross per payment ($)', 'Fee per payment ($)', 'Net per payment ($)', 'Total gross ($)', 'Total fees ($)', 'Total net ($)'], rows: [[count, gross.toNumber(), fee.toNumber(), net.toNumber(), gross.times(count).toNumber(), fee.times(count).toNumber(), net.times(count).toNumber()]]}, notes: [stripe ? 'Preset: Stripe US standard domestic online cards, 2.9% + USD 0.30. Checked October 13, 2026; verify your current agreement.' : 'Custom percentage plus fixed-fee model. A small payment may have negative net receipts when the fixed fee exceeds the payment.', 'Reverse calculations find the smallest charge at the chosen precision that meets the target after rounded fees. This is pricing arithmetic, not permission to impose a surcharge.']};
}

function breakeven(v: Values): Result {
  const fixed = numeric(v, 'fixedCost'), price = numeric(v, 'price'), variable = numeric(v, 'variableCost'), target = numeric(v, 'targetProfit'), units = whole(numeric(v, 'plannedUnits', 0, 1e9), 'Planned units'), contribution = price - variable;
  const possible = contribution > 0, exact = possible ? fixed / contribution : fixed === 0 ? 0 : null;
  const needed = possible ? new Decimal(fixed).plus(target).div(new Decimal(price).minus(variable)).ceil().toNumber() : fixed + target === 0 ? 0 : null;
  const wholeBreak = possible ? new Decimal(fixed).div(new Decimal(price).minus(variable)).ceil().toNumber() : exact;
  const rows: (number | string)[][] = [...new Set([0, units, ...(wholeBreak !== null ? [wholeBreak] : []), ...(needed !== null ? [needed] : [])])].sort((a, b) => a - b).map(quantity => [quantity, quantity * price, fixed + quantity * variable, quantity * contribution - fixed]);
  return {metrics: [metric('Break-even whole units', wholeBreak ?? 'No positive contribution'), money('Break-even sales revenue', exact === null ? 'Not attainable' : exact * price), money('Contribution per unit', contribution), metric('Contribution margin', price > 0 ? contribution / price * 100 : 'Not defined for zero price', 'percent'), metric('Units for target profit', needed ?? 'Not attainable'), money('Profit at planned sales', units * contribution - fixed), metric('Margin of safety', possible && units > 0 ? (units - (exact ?? 0)) / units * 100 : 'Not defined', 'percent')], table: {headers: ['Units sold', 'Revenue ($)', 'Total cost ($)', 'Operating profit ($)'], rows}, notes: ['Break-even sales revenue uses the fractional threshold; whole-unit targets round up. A negative margin of safety means planned sales fall below break-even.', ...(!possible ? ['Selling price must exceed variable cost to earn a positive contribution. Selling more at a loss does not solve the shortfall.'] : [])]};
}

function networth(v: Values): Result {
  toolkitDate(v.snapshotDate, 'Snapshot date');
  const assets = amountRows(v, 'assets', 'Assets'), debts = amountRows(v, 'debts', 'Liabilities');
  if (assets.some(row => !['yes', 'no'].includes(String(row.liquid)))) throw Error('Choose whether each asset is liquid.');
  const total = sum(assets.map(row => row.amount)), debt = sum(debts.map(row => row.amount)), liquid = sum(assets.filter(row => row.liquid === 'yes').map(row => row.amount));
  return {metrics: [money('Net worth', new Decimal(total).minus(debt).toNumber()), money('Total assets', total), money('Total liabilities', debt), money('Liquid assets', liquid), metric('Snapshot date', v.snapshotDate), metric('Debt-to-assets ratio', total > 0 ? debt / total * 100 : 'Not defined without assets', 'percent')], table: {headers: ['Type', 'Item', 'Value ($)'], rows: [...assets.map(row => [row.liquid === 'yes' ? 'Liquid asset' : 'Asset', row.name, row.amount]), ...debts.map(row => ['Liability', row.name, row.amount])]}, chart: [{label: 'Assets', value: total}, {label: 'Liabilities (subtracted)', value: -debt}], notes: ['Save a named calculation to add a dated snapshot to the history below. Values stay in this browser unless you export or share them.']};
}

function emergency(v: Values): Result {
  const expenses = sum(amountRows(v, 'expenses', 'Expenses').map(row => row.amount)), target = expenses * numeric(v, 'months', 0, 120) + numeric(v, 'extraReserve'), saved = numeric(v, 'saved'), deposit = numeric(v, 'monthlySaving'), gap = Math.max(0, target - saved), months = gap === 0 ? 0 : deposit > 0 ? new Decimal(gap).div(deposit).ceil().toNumber() : null;
  const table: Result['table'] = {headers: ['Month', 'Deposit ($)', 'Emergency savings ($)'], rows: [[0, 0, saved]]};
  if (months !== null) for (let month = 1; month <= Math.min(months, 1200); month++) {
    const before = Math.min(gap, deposit * (month - 1)), next = Math.min(gap, deposit * month);
    table.rows.push([month, next - before, saved + next]);
  }
  return {metrics: [money('Emergency fund target', target), money('Savings still needed', gap), metric('Months to goal', months ?? 'No progress without deposits'), metric('Current expense coverage', expenses > 0 ? saved / expenses : 'Not defined without expenses', 'number', expenses > 0 ? 'months' : undefined), money('Monthly essential expenses', expenses), money('Savings above target', Math.max(0, saved - target))], table, notes: ['No interest, price changes, or withdrawals are assumed. The final deposit fills only the remaining gap.', ...(months !== null && months > 1200 ? ['The schedule displays the first 1,200 months; the months-to-goal metric shows the complete arithmetic result.'] : [])]};
}

function subscriptions(v: Values): Result {
  const periods: Record<string, number> = {weekly: 52, 'four-weekly': 13, monthly: 12, quarterly: 4, yearly: 1};
  const entries = parseRows(v.subscriptions, 'Subscriptions').map((row, index) => {
    const name = rowText(row.name, `Subscription ${index + 1} name`), cycle = String(row.cycle), action = String(row.action);
    if (!Object.hasOwn(periods, cycle) || !['keep', 'cancel', 'annual'].includes(action)) throw Error('Choose a valid subscription cycle and action.');
    const annual = rowNumber(row.cost, `${name} cycle cost`, 0, 1e12) * periods[cycle];
    const planned = action === 'cancel' ? 0 : action === 'annual' ? rowNumber(row.annualOffer, `${name} annual offer`, 0, 1e12) : annual;
    return {name, action, annual, planned};
  });
  const current = sum(entries.map(row => row.annual)), planned = sum(entries.map(row => row.planned));
  return {metrics: [money('Current monthly equivalent', current / 12), money('Current annual spending', current), money('Planned annual spending', planned), money('Annual savings', current - planned), money('Monthly savings equivalent', (current - planned) / 12), metric('Subscriptions entered', entries.length)], table: {headers: ['Subscription', 'Action', 'Current monthly ($)', 'Current annual ($)', 'Planned annual ($)', 'Annual savings ($)'], rows: entries.map(row => [row.name, row.action === 'annual' ? 'Switch to annual' : row.action === 'cancel' ? 'Cancel' : 'Keep', row.annual / 12, row.annual, row.planned, row.annual - row.planned])}, chart: entries.filter(row => row.annual > 0).map(row => ({label: row.name, value: row.annual})), notes: ['A negative saving means the proposed plan costs more. Figures compare a full year after changes; no cancellation, refund, or reminder is performed.']};
}

export type Settlement = {from: string; to: string; amount: number};
export function splitExpenses(v: Values) {
  const precision = precisionOf(v), factor = 10 ** precision;
  const people = parseRows(v.people, 'Participants').map((row, i) => ({name: rowText(row.name, `Participant ${i + 1} name`), weight: rowNumber(row.weight, `Participant ${i + 1} weight`, .000001, 1e6), paid: 0, owed: 0}));
  if (people.length < 2) throw Error('Add at least two participants.');
  const names = new Map(people.map((person, index) => [person.name.toLocaleLowerCase('en'), index]));
  if (names.size !== people.length || people.some(person => /[:,]/.test(person.name))) throw Error('Use unique participant names without commas or colons.');
  let total = 0;
  for (const [index, expense] of parseRows(v.expenses, 'Expenses').entries()) {
    rowText(expense.description, `Expense ${index + 1} description`);
    const payer = names.get(rowText(expense.payer, `Expense ${index + 1} payer`).toLocaleLowerCase('en'));
    if (payer === undefined) throw Error(`Expense ${index + 1} payer must match a participant name.`);
    const units = new Decimal(rowNumber(expense.amount, `Expense ${index + 1} amount`, 0, 1e9)).times(factor).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
    const shares = rowText(expense.shares ?? '', `Expense ${index + 1} shares`, true);
    const weights = shares ? new Map<number, number>() : new Map(people.map((person, i) => [i, person.weight]));
    if (shares) for (const entry of shares.split(',')) {
      const pair = entry.split(':');
      const person = names.get(pair[0].trim().toLocaleLowerCase('en'));
      if (pair.length !== 2 || person === undefined || weights.has(person)) throw Error(`Check expense ${index + 1} shares. Use each participant name once, followed by a colon and weight.`);
      weights.set(person, rowNumber(pair[1], 'Share weight', .000001, 1e6));
    }
    const weightTotal = new Decimal(sum([...weights.values()]));
    const allocation = [...weights].map(([person, weight]) => {const exact = new Decimal(units).times(weight).div(weightTotal), base = exact.floor().toNumber(); return {person, base, remainder: exact.minus(base).toNumber()};});
    allocation.sort((a, b) => b.remainder - a.remainder || a.person - b.person);
    const remainder = units - allocation.reduce((n, share) => n + share.base, 0);
    allocation.forEach((share, i) => {people[share.person].owed += share.base + (i < remainder ? 1 : 0);});
    people[payer].paid += units; total += units;
  }
  const creditors = people.map((person, i) => ({i, balance: person.paid - person.owed})).filter(person => person.balance > 0);
  const debtors = people.map((person, i) => ({i, balance: person.owed - person.paid})).filter(person => person.balance > 0);
  const settlements: Settlement[] = [];
  let c = 0, d = 0;
  while (c < creditors.length && d < debtors.length) {
    const units = Math.min(creditors[c].balance, debtors[d].balance);
    settlements.push({from: people[debtors[d].i].name, to: people[creditors[c].i].name, amount: units / factor});
    creditors[c].balance -= units; debtors[d].balance -= units;
    if (creditors[c].balance === 0) c++;
    if (debtors[d].balance === 0) d++;
  }
  return {total: total / factor, precision, people: people.map(person => ({name: person.name, paid: person.paid / factor, owed: person.owed / factor, balance: (person.paid - person.owed) / factor})), settlements};
}
function split(v: Values): Result {
  const data = splitExpenses(v);
  return {metrics: [money('Total expenses', data.total), metric('Participants', data.people.length), metric('Settlement transfers', data.settlements.length)], table: {headers: ['Record', 'Participant / from', 'To', 'Paid ($)', 'Share owed ($)', 'Net balance ($)', 'Transfer ($)'], rows: [...data.people.map(person => ['Balance', person.name, '', person.paid, person.owed, person.balance, '']), ...data.settlements.map(transfer => ['Settlement', transfer.from, transfer.to, '', '', '', transfer.amount])]}, notes: [data.settlements.length ? 'Positive balances receive money; negative balances pay. Follow the settlement rows to settle the group.' : 'All participants are already settled.', `Amounts are allocated at ${data.precision} decimal places. Fractional remainders are distributed without losing money.`]};
}

function cashflow(v: Values): Result {
  const months = whole(numeric(v, 'months', 1, 120), 'Forecast length'), opening = numeric(v, 'opening'), revenue = numeric(v, 'revenue'), expenses = numeric(v, 'fixedCosts'), rate = numeric(v, 'variableRate', 0, 100) / 100, reserve = numeric(v, 'reserve');
  const growth = numeric(v, 'revenueGrowth', -100, 100) / 100, costGrowth = numeric(v, 'costGrowth', -100, 100) / 100;
  const movements = parseRows(v.oneOffs, 'One-time cash movements').map((row, i) => {
    rowText(row.description, `Cash movement ${i + 1} description`);
    const month = whole(rowNumber(row.month, 'Movement month', 1, months), 'Movement month');
    if (!['in', 'out'].includes(String(row.direction))) throw Error('Choose cash in or cash out for each movement.');
    return {month, direction: row.direction, amount: rowNumber(row.amount, 'Movement amount', 0, 1e12)};
  });
  let cash = opening, firstGap: number | null = opening <= 0 ? 0 : null, firstBuffer: number | null = opening < reserve ? 0 : null, lowest = opening;
  const rows: (number | string)[][] = [[0, opening, 0, 0, 0, 0, 0, 0, opening]];
  for (let month = 1; month <= months; month++) {
    const receipts = revenue * (1 + growth) ** (month - 1), fixed = expenses * (1 + costGrowth) ** (month - 1), variable = receipts * rate;
    const incoming = sum(movements.filter(row => row.month === month && row.direction === 'in').map(row => row.amount)), outgoing = sum(movements.filter(row => row.month === month && row.direction === 'out').map(row => row.amount));
    const net = receipts + incoming - fixed - variable - outgoing, start = cash; cash += net; lowest = Math.min(lowest, cash);
    if (cash <= 0 && firstGap === null) firstGap = month;
    if (cash < reserve && firstBuffer === null) firstBuffer = month;
    rows.push([month, start, receipts, incoming, fixed, variable, outgoing, net, cash]);
  }
  const burn = expenses + revenue * rate - revenue;
  return {metrics: [money('Ending cash balance', cash), metric('First month cash reaches zero or below', firstGap ?? 'Not within forecast'), metric('First month below safety buffer', firstBuffer ?? 'Not within forecast'), money('Lowest projected balance', lowest), money('Funding needed to maintain buffer', Math.max(0, reserve - lowest)), metric('Constant-burn runway', burn > 0 ? opening / burn : 'No recurring first-month cash burn', 'number', burn > 0 ? 'months' : undefined)], table: {headers: ['Month', 'Opening cash ($)', 'Sales receipts ($)', 'Other cash in ($)', 'Fixed expenses ($)', 'Variable expenses ($)', 'Other cash out ($)', 'Net cash flow ($)', 'Ending cash ($)'], rows}, notes: ['Month zero is your starting balance. Cash reaches zero or below when the period-ending balance is nonpositive; intramonth timing is not modeled.', 'Constant-burn runway excludes growth and one-time movements. The full monthly forecast includes them.']};
}

function seller(v: Values, etsy: boolean): Result {
  const sales = numeric(v, 'price') + numeric(v, 'shippingCharged'), collectedTax = numeric(v, 'salesTax'), count = whole(numeric(v, 'orders', 1, 1e7), 'Orders');
  const platform = rounded(new Decimal(sales).times(etsy ? .065 : numeric(v, 'platformRate', 0, 100) / 100));
  const processing = rounded(new Decimal(sales).plus(collectedTax).times(etsy ? .03 : numeric(v, 'processingRate', 0, 100) / 100).plus(etsy ? .25 : numeric(v, 'processingFixed')));
  const listing = etsy ? .2 : numeric(v, 'listingFee'), adRate = etsy ? numeric(v, 'offsiteRate', 0, 15) : numeric(v, 'adFeeRate', 0, 100);
  if (etsy && ![0, 12, 15].includes(adRate)) throw Error('Select a supported Offsite Ads rate.');
  const adFee = rounded(etsy ? Math.min(100, sales * adRate / 100) : sales * adRate / 100), otherFee = numeric(v, 'otherFee');
  const costs = ['productCost', 'shippingCost', 'packaging', 'advertising', 'returnAllowance'].map(key => numeric(v, key));
  const fees = sum([platform, processing, listing, adFee, otherFee]), contribution = new Decimal(sales).minus(sum(costs)).minus(fees).toNumber(), overhead = numeric(v, 'overhead'), profit = new Decimal(contribution).times(count).minus(overhead).toNumber();
  return {metrics: [money('Contribution per order', contribution), money('Monthly operating profit', profit), money('Platform and payment fees per order', fees), metric('Operating profit margin', sales > 0 ? profit / (sales * count) * 100 : 'Not defined without sales', 'percent'), metric('Orders to cover fixed overhead', contribution > 0 ? new Decimal(overhead).div(contribution).ceil().toNumber() : overhead === 0 && contribution === 0 ? 0 : 'No positive contribution'), money('Monthly sales excluding collected tax', sales * count)], table: {headers: ['Per-order component', 'Amount ($)'], rows: [['Sales excluding tax', sales], ['Product cost', costs[0]], ['Shipping cost', costs[1]], ['Packaging', costs[2]], ['Advertising spend', costs[3]], ['Return loss allowance', costs[4]], ['Marketplace transaction fee', platform], ['Processing fee', processing], ['Listing allocation', listing], ['Percentage advertising fee', adFee], ['Other fees', otherFee], ['Contribution before fixed overhead', contribution], ['Allocated fixed overhead', overhead / count], ['Operating profit per order', profit / count]]}, notes: ['Collected sales tax is excluded from revenue but included in the processing-fee base. Profit is before income taxes and owner compensation unless entered as a cost.', ...(etsy ? ['US Etsy example uses one listing allocation per single-item order. Check fees against your statement; extra taxes and service charges are not inferred.'] : [])]};
}

function solar(v: Values): Result {
  const cost = numeric(v, 'installation'), incentive = numeric(v, 'incentive'), financed = numeric(v, 'financed');
  if (incentive > cost) throw Error('The upfront incentive cannot exceed installed cost.');
  const netCost = cost - incentive;
  if (financed > netCost) throw Error('Amount financed cannot exceed the net system cost.');
  const years = whole(numeric(v, 'years', 1, 50), 'Projection length'), term = whole(numeric(v, 'loanYears', 1, 50), 'Loan term') * 12, rate = numeric(v, 'loanRate', 0, 100) / 1200;
  const payment = financed === 0 ? 0 : rate === 0 ? financed / term : financed * rate / -Math.expm1(-term * Math.log1p(rate));
  const generation = numeric(v, 'systemSize', 0, 1e5) * numeric(v, 'yield', 0, 5000), annualUse = numeric(v, 'annualUse', 0, 1e9), selfUse = numeric(v, 'selfUse', 0, 100) / 100, degradation = numeric(v, 'degradation', 0, 20) / 100, escalation = numeric(v, 'tariffGrowth', -100, 30) / 100;
  let cash = -(netCost - financed), unfinanced = -netCost, balance = financed, totalBenefits = 0, totalInterest = 0, firstBenefit = 0, payback: number | null = netCost === 0 ? 0 : null;
  const rows: (number | string)[][] = [[0, 0, 0, 0, 0, 0, cash, cash, balance]];
  for (let year = 1; year <= years; year++) {
    const generated = generation * (1 - degradation) ** (year - 1), self = Math.min(generated * selfUse, annualUse), exported = generated - self, tariffFactor = (1 + escalation) ** (year - 1);
    const benefit = (self * numeric(v, 'gridPrice') + exported * numeric(v, 'exportPrice')) * tariffFactor - numeric(v, 'maintenance');
    let payments = 0;
    for (let month = (year - 1) * 12 + 1; month <= Math.min(year * 12, term); month++) {
      const interest = balance * rate, paid = month === term ? balance + interest : Math.min(payment, balance + interest);
      totalInterest += interest; payments += paid; balance = Math.max(0, balance + interest - paid);
    }
    if (year === 1) firstBenefit = benefit;
    const previous = unfinanced; unfinanced += benefit; cash += benefit - payments; totalBenefits += benefit;
    if (payback === null && unfinanced >= 0 && benefit > 0) payback = year - 1 + (-previous / benefit);
    rows.push([year, generated, self, exported, benefit, payments, benefit - payments, cash, balance]);
  }
  return {metrics: [money('Net installed cost', netCost), money('First-year benefit before financing', firstBenefit), money('Monthly loan payment', payment), metric('Unfinanced payback', payback ?? 'Not reached in projection', 'number', payback !== null ? 'years' : undefined), money('Cumulative cash after financing', cash), money('Loan balance remaining', balance), money('Operating benefits less system cost', totalBenefits - netCost), money('Interest paid in projection', totalInterest)], table: {headers: ['Year', 'Generation (kWh)', 'Used on site (kWh)', 'Exported (kWh)', 'Operating benefit ($)', 'Loan payments ($)', 'Annual cash flow ($)', 'Cumulative cash ($)', 'Loan balance ($)'], rows}, notes: ['Year zero shows your upfront cash. Unfinanced payback interpolates within the first recovery year using annual benefits and excludes financing. Later negative benefits can reverse a recovery.', 'Cumulative cash is not net wealth: any remaining loan balance is shown separately. No resale value, later tax credits, battery replacement, or equipment replacement is assumed.']};
}

function ev(v: Values): Result {
  const distance = numeric(v, 'distance', 0, 1e7), years = whole(numeric(v, 'years', 1, 30), 'Ownership period'), electric = numeric(v, 'evPrice') + numeric(v, 'charger'), petrol = numeric(v, 'petrolPrice');
  if (!['metric', 'us'].includes(v.units)) throw Error('Choose metric or US units.');
  const gridEnergy = distance / 100 * numeric(v, 'evEfficiency', .01, 1000) / (1 - numeric(v, 'chargingLoss', 0, 90) / 100), homeShare = numeric(v, 'homeShare', 0, 100) / 100;
  const fuel = v.units === 'us' ? distance / numeric(v, 'fuelEfficiency', .01, 1000) : distance / 100 * numeric(v, 'fuelEfficiency', .01, 1000);
  const electricEnergyCost = gridEnergy * (homeShare * numeric(v, 'homeRate') + (1 - homeShare) * numeric(v, 'publicRate')), petrolEnergyCost = fuel * numeric(v, 'fuelPrice');
  const electricRunning = electricEnergyCost + numeric(v, 'evMaintenance') + numeric(v, 'evInsurance'), petrolRunning = petrolEnergyCost + numeric(v, 'petrolMaintenance') + numeric(v, 'petrolInsurance'), saving = petrolRunning - electricRunning, premium = electric - petrol;
  const evResale = numeric(v, 'evResale'), petrolResale = numeric(v, 'petrolResale');
  const evTotal = electric + years * electricRunning - evResale, petrolTotal = petrol + years * petrolRunning - petrolResale;
  const rows = Array.from({length: years + 1}, (_, year) => {const evCost = electric + year * electricRunning - (year === years ? evResale : 0), petrolCost = petrol + year * petrolRunning - (year === years ? petrolResale : 0); return [year, evCost, petrolCost, petrolCost - evCost];});
  return {metrics: [money('EV total ownership cost', evTotal), money('Petrol total ownership cost', petrolTotal), money('EV savings over ownership period', petrolTotal - evTotal), money('EV annual charging cost', electricEnergyCost), money('Petrol annual fuel cost', petrolEnergyCost), money('EV annual running-cost savings', saving), metric('Simple running-cost payback', premium <= 0 ? 'No EV upfront premium' : saving > 0 ? premium / saving : 'No payback from running costs', 'number', premium > 0 && saving > 0 ? 'years' : undefined), metric('EV grid energy per year', gridEnergy, 'number', 'kWh')], table: {headers: ['Year', 'EV cumulative cost ($)', 'Petrol cumulative cost ($)', 'EV savings ($)'], rows}, notes: ['Positive EV savings favor the EV; negative savings favor petrol. Resale values reduce costs only at the end of the selected ownership period.', 'Simple payback excludes resale and may occur after the chosen ownership period. Charging loss is the fraction of purchased grid energy that does not reach the battery.']};
}

function runToolkitModel(algorithm: string, v: Values): Result {
  switch (algorithm) {
    case 'toolkit-freelance': return freelance(v);
    case 'toolkit-invoice': {
      const doc = calculateInvoice(v);
      return {metrics: [money('Balance due', doc.balance), money('Document total', doc.total), money('Subtotal', doc.subtotal), money('Discount', doc.discount), money('Shipping', doc.shipping), money('Tax', doc.tax), money('Amount already paid', doc.paid)], table: {headers: ['Description', 'Quantity', 'Unit price ($)', 'Line total ($)'], rows: doc.items.map(item => [item.description, item.quantity, item.rate, item.total])}, notes: [`${doc.type} ${doc.number}. Issued ${doc.issueDate}; due or valid until ${doc.dueDate}. Amounts rounded to ${doc.precision} decimal places.`]};
    }
    case 'toolkit-payment': return payment(v, false);
    case 'toolkit-stripe': return payment(v, true);
    case 'toolkit-breakeven': return breakeven(v);
    case 'toolkit-networth': return networth(v);
    case 'toolkit-emergency': return emergency(v);
    case 'toolkit-subscriptions': return subscriptions(v);
    case 'toolkit-split': return split(v);
    case 'toolkit-cashflow': return cashflow(v);
    case 'toolkit-seller': return seller(v, false);
    case 'toolkit-etsy': return seller(v, true);
    case 'toolkit-solar': return solar(v);
    case 'toolkit-ev': return ev(v);
    default: throw Error('Unknown planning tool.');
  }
}

export function runToolkit(algorithm: string, values: Values): Result {
  const result = runToolkitModel(algorithm, values);
  if (['toolkit-invoice', 'toolkit-payment', 'toolkit-stripe', 'toolkit-split'].includes(algorithm)) {
    const precision = algorithm === 'toolkit-stripe' ? 2 : precisionOf(values);
    result.metrics = result.metrics.map(metric => metric.format === 'money' ? {...metric, digits: precision} : metric);
    if (result.table) result.table.moneyDigits = precision;
  }
  return result;
}
