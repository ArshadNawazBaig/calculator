export const ECB_FEED='https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
export const ECB_SOURCE='https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html';
export type ReferenceRates={provider:'European Central Bank';date:string;retrievedAt:string;base:'EUR';rates:Record<string,number>;cached?:boolean};

export function parseEcbFeed(xml:string,now=new Date()):ReferenceRates{
  if(xml.length>100_000||!xml.includes('European Central Bank'))throw Error('The reference-rate response is not recognized.');
  const date=xml.match(/\btime=['"](\d{4}-\d{2}-\d{2})['"]/)?.[1];
  if(!date||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error('The reference-rate date is missing or invalid.');
  const age=now.getTime()-Date.parse(date);
  if(age < -86400000||age>14*86400000)throw Error('The available reference rates are outside the supported freshness window.');
  const rates:Record<string,number>={EUR:1};
  for(const match of xml.matchAll(/\bcurrency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)){
    const rate=Number(match[2]);if(!Number.isFinite(rate)||rate<=0||rates[match[1]]!==undefined)throw Error('Invalid reference-rate data.');rates[match[1]]=rate;
  }
  if(!rates.USD||!rates.GBP||!rates.CAD||Object.keys(rates).length<10)throw Error('The reference-rate feed is incomplete.');
  return {provider:'European Central Bank',date,retrievedAt:now.toISOString(),base:'EUR',rates};
}

export function referenceConversion(amount:number,from:string,to:string,data:ReferenceRates){
  if(!Number.isFinite(amount)||amount<0)throw Error('Amount must be a finite nonnegative number.');
  if(!Number.isFinite(data.rates[from])||data.rates[from]<=0||!Number.isFinite(data.rates[to])||data.rates[to]<=0)throw Error('One of the currencies is unavailable in the latest ECB reference.');
  const rate=data.rates[to]/data.rates[from],converted=amount*rate;
  if(!Number.isFinite(converted))throw Error('The converted amount exceeds the supported range.');
  return {rate,converted};
}

export function validateReferenceRates(data:ReferenceRates, now=Date.now()):ReferenceRates {
 if(data.provider!=='European Central Bank'||data.base!=='EUR'||!/^\d{4}-\d{2}-\d{2}$/.test(data.date)||!Number.isFinite(Date.parse(data.date))||new Date(data.date).toISOString().slice(0,10)!==data.date)throw Error('Invalid reference-rate response.');
 const age=now-Date.parse(data.date);
 if(age < -86400000||age>14*86400000||data.rates?.EUR!==1||Object.keys(data.rates).length<10||!data.rates.USD||!data.rates.GBP||!data.rates.CAD||Object.entries(data.rates).some(([code,value])=>! /^[A-Z]{3}$/.test(code)||!Number.isFinite(value)||value<=0))throw Error('Invalid or outdated reference rates.');
 return data;
}
