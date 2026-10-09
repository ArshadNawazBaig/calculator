import parameters from '@/data/federal-tax-years.json';
export function taxYear(value:unknown=2026):2025|2026{
  if(value===undefined)return 2026;
  if((typeof value!=='string'&&typeof value!=='number')||!['2025','2026'].includes(String(value)))throw Error('Choose supported tax year 2025 or 2026.');
  return Number(value) as 2025|2026;
}
export function taxParameters(v:Record<string,unknown>){return parameters.years[taxYear(v.taxYear)];}
