'use client';
import {useState} from 'react';
import {useI18n} from '@/components/i18n/provider';
import {languages} from '@/lib/i18n/config';
import copy from '@/data/locales/learning-demos.json';
import {SectionHeading} from './section-heading';
import explanation from '@/components/content/explanation.module.css';
import home from './home.module.css';
import styles from './percentage-demo.module.css';

export function PercentageDemo() {
  const {locale,t} = useI18n(), text = copy[locale], [rate,setRate] = useState(20);
  const values = [100,100 * (1+rate/100),100 * (1+rate/100) * (1-rate/100)];
  const number = new Intl.NumberFormat(languages[locale].tag,{maximumFractionDigits:2});
  return <section className={`container ${home.section}`} aria-labelledby="percentage-demo-title">
    <SectionHeading id="percentage-demo-title" eyebrow={t('Look beyond the result')} title={text.title} description={text.note}/>
    <div className={styles.demo}>
      <div className={styles.controls}>
        <label htmlFor="percentage-demo-rate"><span>{text.rate}</span><strong>{number.format(rate)}</strong></label>
        <input id="percentage-demo-rate" type="range" min="1" max="50" step="1" value={rate} onChange={event => setRate(Number(event.target.value))}/>
        <p className={`${explanation.formula} ${styles.formula}`} dir="ltr">100 × (1 + {rate}/100) × (1 − {rate}/100) = {number.format(values[2])}</p>
      </div>
      <div className={`${explanation.scroll} ${styles.results}`} role="region" aria-label={text.title} tabIndex={0}>
        <table className={explanation.table}><tbody>{[text.start,text.up,text.down].map((label,index) => <tr key={label}><th scope="row">{label}</th><td><output htmlFor="percentage-demo-rate">{number.format(values[index])}</output><span className={explanation.track} aria-hidden="true"><span className={explanation.fill} style={{width:`${values[index]/150*100}%`}}/></span></td></tr>)}</tbody></table>
      </div>
    </div>
  </section>;
}
