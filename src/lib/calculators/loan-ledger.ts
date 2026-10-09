import {integer,nonnegative} from './helpers';
import Decimal from 'decimal.js';
const D=Decimal.clone({precision:256});
export type LoanRow={period:number;interest:number;regularPayment:number;extraPayment:number;endingBalance:number};
export function loanLedger(principal:number,annualRate:number,months:number,extra:(period:number)=>number=()=>0,paymentOverride?:number){
 nonnegative(principal,'Principal');nonnegative(annualRate,'APR');integer(months,1,1200);const rate=new D(annualRate).div(1200);
 if(months*Math.log1p(annualRate/1200)>400)throw Error('These rate and term inputs exceed the supported amortization precision.');
 const payment=paymentOverride===undefined?(rate.isZero()?new D(principal).div(months):new D(principal).times(rate).div(new D(1).minus(new D(1).plus(rate).pow(-months)))):new D(nonnegative(paymentOverride,'Payment'));
 let balance=new D(principal),interestTotal=new D(0),total=new D(0);const rows:LoanRow[]=[];
 for(let period=1;period<=months&&balance.gt('0.00000001');period++){
  const interest=balance.times(rate),regularPayment=D.min(payment,balance.plus(interest)),extraPayment=D.min(nonnegative(extra(period),'Extra payment'),D.max(0,balance.plus(interest).minus(regularPayment)));
  balance=D.max(0,balance.plus(interest).minus(regularPayment).minus(extraPayment));if(balance.lt('0.00000001'))balance=new D(0);interestTotal=interestTotal.plus(interest);total=total.plus(regularPayment).plus(extraPayment);rows.push({period,interest:interest.toNumber(),regularPayment:regularPayment.toNumber(),extraPayment:extraPayment.toNumber(),endingBalance:balance.toNumber()});
 }
 if(paymentOverride===undefined&&balance.gt(Math.max(1e-7,principal*1e-10)))throw Error('These rate and term inputs exceed reliable amortization precision.');
 return {payment:payment.toNumber(),rows,balance:balance.toNumber(),interest:interestTotal.toNumber(),total:total.toNumber(),months:rows.length};
}
export function monthIndex(raw:string){if(!/^\d{4}-\d{2}$/.test(raw))throw Error('Use YYYY-MM for payment months.');const [year,month]=raw.split('-').map(Number);if(year<1||year>9999||month<1||month>12)throw Error('Use a payment month between 0001-01 and 9999-12.');return year*12+month-1;}
export function printMonth(index:number){const year=Math.floor(index/12),month=index%12+1;if(year<1||year>9999)throw Error('Payment schedule exceeds years 0001–9999.');return `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}`;}
