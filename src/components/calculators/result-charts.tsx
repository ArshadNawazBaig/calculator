'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {useI18n} from '@/components/i18n/provider';
import {languages} from '@/lib/i18n/config';
import {money,number} from '@/lib/format';
import {chartDomain,type SeriesChart,type BreakdownChart} from '@/lib/calculators/result-presentation';
import styles from './result-charts.module.css';

const colors = ['#087f5b','#64766a','#839c3b','#326b62','#997b46','#396b42','#73938c','#74845d'];
const height=240, left=72, right=20, top=22, bottom=38;

export function ResultCharts({series,breakdown,currency}: {series?:SeriesChart;breakdown?:BreakdownChart;currency:string}) {
  if(!series&&!breakdown)return null;
  return <div className={`${styles.grid} ${series&&breakdown?styles.pair:''}`} data-result-charts>
    {series&&<TimelineChart chart={series} currency={currency}/>}
    {breakdown&&<Breakdown chart={breakdown} currency={currency}/>}
  </div>;
}

function TimelineChart({chart,currency}: {chart:SeriesChart;currency:string}) {
  const {t,locale}=useI18n();
  const titleId=useId(), rangeId=useId();
  const plotRef=useRef<SVGSVGElement>(null);
  const [width,setWidth]=useState(640);
  useEffect(()=>{
    const plot=plotRef.current;
    if(!plot)return;
    const observer=new ResizeObserver(([entry])=>setWidth(Math.max(200,Math.round(entry.contentRect.width))));
    observer.observe(plot);
    return ()=>observer.disconnect();
  },[]);
  const [active,setActive]=useState<number|null>(null);
  const selected=Math.min(active??chart.points.length-1,chart.points.length-1);
  const point=chart.points[selected];
  const domain=chartDomain(chart.points.flatMap(point=>point.values));
  const start=chart.points[0].x, end=chart.points.at(-1)!.x;
  const x=(value:number)=>left+(value-start)/(end-start)*(width-left-right);
  const y=(value:number)=>height-bottom-domain.position(value)*(height-top-bottom);
  const tag=languages[locale].tag;
  const compact=(value:number)=>new Intl.NumberFormat(locale==='ar'?'ar-u-nu-arab':tag,{notation:'compact',maximumFractionDigits:1}).format(value);
  const displayLabel=(label:string)=>/^\d+(?:\.\d+)?$/.test(label)?number(Number(label),2,tag):label;
  const values=point.values.map((value,index)=>`${t(chart.labels[index])}: ${money(value,currency,undefined,tag)}`).join('; ');
  const ticks=[0,.25,.5,.75,1].map(fraction=>(domain.min+fraction*(domain.max-domain.min))*domain.magnitude);
  const xTicks=[...new Set([0,Math.floor((chart.points.length-1)/2),chart.points.length-1])];
  return <section className={styles.card} aria-labelledby={titleId} data-chart="timeline">
    <div className={styles.heading}><h2 id={titleId}>{t(chart.title)}</h2><span>{currency}</span></div>
    <div className={styles.legend}>{chart.labels.map((label,index)=><span key={label}><i style={{background:colors[index%colors.length]}}/>{t(label)}</span>)}</div>
    <svg ref={plotRef} viewBox={`0 0 ${width} ${height}`} className={styles.plot} role="img" aria-label={t('{title}. Values are listed in the table below.',{title:t(chart.title)})} style={{direction:'ltr'}}
      onPointerMove={event=>{const box=event.currentTarget.getBoundingClientRect();const position=(event.clientX-box.left)/box.width*width;let nearest=0;for(let index=1;index<chart.points.length;index++)if(Math.abs(x(chart.points[index].x)-position)<Math.abs(x(chart.points[nearest].x)-position))nearest=index;setActive(nearest);}}>
      {ticks.map((value,index)=><g key={index}><line x1={left} x2={width-right} y1={y(value)} y2={y(value)} stroke={value===0?'#b7c9bf':'#e5ece7'} strokeDasharray={value===0?undefined:'3 5'}/><text x={left-10} y={y(value)+4} textAnchor="end">{compact(value)}</text></g>)}
      {chart.labels.map((label,index)=><path key={label} d={chart.points.map((point,pointIndex)=>`${pointIndex?'L':'M'}${x(point.x).toFixed(2)},${y(point.values[index]).toFixed(2)}`).join(' ')} fill="none" stroke={colors[index%colors.length]} strokeWidth={index===0?3:2} strokeDasharray={index===0?undefined:'6 5'} strokeLinejoin="round"/>)}
      <line x1={x(point.x)} x2={x(point.x)} y1={top} y2={height-bottom} stroke="#9db9aa" strokeDasharray="4 5"/>
      {point.values.map((value,index)=><circle key={index} cx={x(point.x)} cy={y(value)} r={5} fill={colors[index%colors.length]} stroke="white" strokeWidth={2}/>)}
      {xTicks.map(index=><text key={index} x={x(chart.points[index].x)} y={height-12} textAnchor={index===0?'start':index===chart.points.length-1?'end':'middle'}>{displayLabel(chart.points[index].label)}</text>)}
    </svg>
    <div className={styles.selected}><span>{t(chart.xLabel)} <strong>{displayLabel(point.label)}</strong></span><div>{point.values.map((value,index)=><span key={index}>{t(chart.labels[index])}<strong>{money(value,currency,undefined,tag)}</strong></span>)}</div></div>
    <div className={styles.explore}><label htmlFor={rangeId}>{t('Explore the timeline')}</label><input id={rangeId} type="range" min={0} max={chart.points.length-1} step={1} value={selected} onChange={event=>setActive(Number(event.target.value))} aria-valuetext={`${t(chart.xLabel)} ${displayLabel(point.label)}; ${values}`} dir="ltr"/></div>
  </section>;
}

function Breakdown({chart,currency}: {chart:BreakdownChart;currency:string}) {
  const {t,locale}=useI18n();
  const titleId=useId();
  const total=chart.items.reduce((sum,item)=>sum+item.value,0);
  const donut=total>0&&Number.isFinite(total)&&chart.items.every(item=>item.value>=0);
  const domain=chartDomain(chart.items.map(item=>item.value));
  const tag=languages[locale].tag;
  const magnitude=Math.max(...chart.items.map(item=>Math.abs(item.value)),1);
  const normalizedTotal=chart.items.reduce((sum,item)=>sum+item.value/magnitude,0);
  const circumference=2*Math.PI*66;
  return <section className={styles.card} aria-labelledby={titleId} data-chart={donut?'composition':'comparison'}>
    <div className={styles.heading}><h2 id={titleId}>{t(chart.title)}</h2><span>{currency}</span></div>
    <p className={styles.description}>{t(chart.description)}</p>
    {donut&&<div className={styles.donut}>
      <svg viewBox="0 0 180 180" role="img" aria-label={chart.items.map(item=>`${t(item.label)}: ${money(item.value,currency,undefined,tag)}`).join('; ')}>
        <circle cx="90" cy="90" r="66" fill="none" stroke="#edf2ef" strokeWidth="22"/>
        {chart.items.map((item,index)=>{
          const share=(item.value/magnitude)/normalizedTotal;
          const offset=chart.items.slice(0,index).reduce((sum,previous)=>sum+previous.value/magnitude,0)/normalizedTotal;
          return <circle key={index} cx="90" cy="90" r="66" fill="none" stroke={colors[index%colors.length]} strokeWidth="22" strokeDasharray={`${share*circumference} ${circumference}`} strokeDashoffset={-offset*circumference} transform="rotate(-90 90 90)"/>;
        })}
      </svg><div><span>{t('Total')}</span><strong>{money(total,currency,undefined,tag)}</strong></div>
    </div>}
    <ul className={`${styles.breakdown} ${!donut?styles.comparison:''}`}>
      {chart.items.map((item,index)=><li key={index}>
        <div><span><i style={{background:item.value<0?'#a05035':colors[index%colors.length]}}/>{t(item.label)}</span><strong>{money(item.value,currency,undefined,tag)}</strong>{donut&&<small>{number(item.value/total*100,1,tag)}%</small>}</div>
        {!donut&&<div className={styles.bar} aria-hidden="true" dir="ltr"><b style={{left:`${domain.position(0)*100}%`}}/><i style={{left:`${Math.min(domain.position(0),domain.position(item.value))*100}%`,width:`${Math.abs(domain.position(item.value)-domain.position(0))*100}%`,background:item.value<0?'#a05035':colors[index%colors.length]}}/></div>}
      </li>)}
    </ul>
  </section>;
}
