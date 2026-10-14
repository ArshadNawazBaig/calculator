"use client";
import {useI18n} from '@/components/i18n/provider';
import Link from "@/components/i18n/link";
import {ChevronRight} from "lucide-react";
import {CalculatorCard} from "@/components/calculators/calculator-card";
import {Icon} from "@/components/ui/icon";
import {categoryLabels,type FeaturedTool,type Spotlight} from "@/lib/home-content";
import styles from "./home.module.css";

function GrowthIllustration() {
  return <svg className={styles.growthIllustration} viewBox="0 0 260 130" fill="none" aria-hidden="true">
    <defs><linearGradient id="home-growth-fill" x1="130" y1="15" x2="130" y2="125" gradientUnits="userSpaceOnUse"><stop stopColor="var(--color-illustration)" stopOpacity=".5"/><stop offset="1" stopColor="var(--color-illustration)" stopOpacity=".02"/></linearGradient></defs>
    <path d="M12 117C53 110 65 102 88 93S128 73 150 62S194 40 218 23L248 6V118H12Z" fill="url(#home-growth-fill)"/>
    <path d="M12 117C53 110 65 102 88 93S128 73 150 62S194 40 218 23L248 6" stroke="var(--color-illustration)" strokeWidth="2"/>
    <path d="M12 118H249" stroke="var(--color-illustration)" strokeOpacity=".3"/>
    {[[72,100],[132,71],[190,40],[248,6]].map(([cx,cy])=><circle key={cx} cx={cx} cy={cy} r="4" fill="var(--color-illustration)"/>)}
  </svg>;
}

export function SpotlightPanel({spotlight}:{spotlight:Spotlight}) {
  const {t}=useI18n();
  return <article className={styles.spotlight} data-category={spotlight.category} data-theme-surface="dark">
    <div className={styles.spotlightCopy}><span className={styles.spotlightLabel}>{t('{category} in focus',{category:t(categoryLabels[spotlight.category])})}</span>
      <h3>{t(spotlight.title)}</h3><p>{t(spotlight.description)}</p></div>
    <div className={styles.spotlightLinks}>{spotlight.links.map(link=><Link key={link.slug} href={link.href || `/${link.slug}`}>{t(link.title)}<ChevronRight size={18} aria-hidden="true"/></Link>)}</div>
    {spotlight.category==="finance"?<GrowthIllustration/>:<Icon className={styles.spotlightIllustration} name={spotlight.category} size={125} strokeWidth={1}/>}
  </article>;
}

export function FeaturedToolCard({tool}:{tool:FeaturedTool}) {
  return <CalculatorCard tool={tool}/>;
}
