import {mortgageIllustration, growthIllustration, bmiIllustration} from '@/lib/guide-illustrations';
import {translator, languages, type Dictionary, type Locale} from '@/lib/i18n/config';
import copy from '@/data/locales/guide-visuals.json';
import styles from './explanation.module.css';

export function GuideIllustration({slug, locale = 'en', messages = {}}: {slug: string; locale?: Locale; messages?: Dictionary}) {
  const t = translator(messages), text = copy[locale], tag = languages[locale].tag;
  const number = (value:number) => new Intl.NumberFormat(tag,{maximumFractionDigits:2}).format(value);
  const money = (value:number) => new Intl.NumberFormat(tag,{style:'currency',currency:'USD'}).format(value);
  const mortgage = slug === 'understanding-mortgage-payments', growth = slug === 'compound-interest-and-contributions';
  if (!mortgage && !growth && slug !== 'bmi-as-a-screening-tool') return null;
  const mortgageData = mortgageIllustration(), growthData = growthIllustration();
  const values: Record<string,string> = {principal:money(mortgage ? 320000 : 10000), payment:money(mortgageData.payment), rate:new Intl.NumberFormat(tag,{style:'percent',maximumFractionDigits:1}).format(mortgage ? .065 : .05), years:number(30), weight:`${number(70)} kg`};
  const note = (mortgage ? text.mortgageNote : growth ? text.growthNote : text.bmiNote).replace(/\{(\w+)\}/g, (token,key:string) => values[key] ?? token);
  const title = mortgage ? text.mortgageTitle : growth ? text.growthTitle : text.bmiTitle;
  const headers = mortgage ? ['Month','Principal','Interest','Balance'] : growth ? ['Years','Principal','Interest','Balance'] : ['Weight','Height','BMI'];
  const rows = mortgage ? mortgageData.rows.map(row => [number(row.month),money(row.principal),money(row.interest),money(row.balance)])
    : growth ? growthData.map(row => [number(row.year),money(row.deposit),money(row.balance-row.deposit),money(row.balance)])
    : bmiIllustration().map(row => [`${number(row.weight)} kg`,`${number(row.height)} m`,`${number(row.bmi)} kg/m²`]);
  return <section className={styles.panel} data-guide-illustration>
    <h2>{title}</h2><p>{note}</p>
    <div className={styles.scroll} role="region" aria-label={title} tabIndex={0}><table className={styles.table}>
      <thead><tr>{headers.map(header => <th scope="col" key={header}>{t(header)}</th>)}</tr></thead>
      <tbody>{rows.map((row,index) => <tr key={index}>{row.map((value,column) => column === 0 ? <th scope="row" key={column} dir="auto">{value}</th> : <td key={column} dir="auto">{value}{column === 2 && (mortgage || growth) && <span className={styles.track} aria-hidden="true"><span className={styles.fill} style={{width:`${mortgage ? mortgageData.rows[index].interest / mortgageData.payment * 100 : (growthData[index].balance - 10000) / growthData[index].balance * 100}%`}}/></span>}</td>)}</tr>)}</tbody>
    </table></div>
  </section>;
}
