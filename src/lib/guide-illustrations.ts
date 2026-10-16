/** Independently inspectable examples used only by the explanatory guide diagrams. */
export function mortgageIllustration() {
  const rate = .065 / 12, principal = 320000, months = 360;
  const payment = principal * rate / (1 - (1 + rate) ** -months);
  let balance = principal;
  const rows: {month:number;interest:number;principal:number;balance:number}[] = [];
  for (let month = 1; month <= months; month++) {
    const interest = balance * rate, paid = Math.min(balance, payment - interest);
    balance = Math.max(0,balance - paid);
    if ([1,120,240,360].includes(month)) rows.push({month,interest,principal:paid,balance});
  }
  return {payment,rows};
}
export const growthIllustration = () => [0,1,5,10].map(year => ({year,deposit:10000,balance:10000 * 1.05 ** year}));
export const bmiIllustration = () => [1.75,1.80].map(height => ({weight:70,height,bmi:70 / height ** 2}));
