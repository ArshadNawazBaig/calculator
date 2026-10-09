import Link from "next/link";
import {CalculatorCard} from "@/components/calculators/calculator-card";
import {Icon} from "@/components/ui/icon";
import {categoryLabels,type FeaturedTool,type Spotlight} from "@/lib/home-content";
import styles from "./home.module.css";

function GrowthIllustration() {
  return <svg className={styles.growthIllustration} viewBox="0 0 260 130" fill="none" aria-hidden="true">
    <defs><linearGradient id="home-growth-fill" x1="130" y1="15" x2="130" y2="125" gradientUnits="userSpaceOnUse"><stop stopColor="var(--color-illustration)" stopOpacity=".5"/><stop offset="1" stopColor="#fff" stopOpacity=".02"/></linearGradient></defs>
    <path d="M12 117C53 110 65 102 88 93S128 73 150 62S194 40 218 23L248 6V118H12Z" fill="url(#home-growth-fill)"/>
    <path d="M12 117C53 110 65 102 88 93S128 73 150 62S194 40 218 23L248 6" stroke="white" strokeWidth="2"/>
    <path d="M12 118H249" stroke="white" strokeOpacity=".3"/>
    {[[72,100],[132,71],[190,40],[248,6]].map(([cx,cy])=><circle key={cx} cx={cx} cy={cy} r="4" fill="white"/>)}
  </svg>;
}

export function SpotlightPanel({spotlight}:{spotlight:Spotlight}) {
  return <article className={styles.spotlight} data-category={spotlight.category}>
    <span className={styles.spotlightLabel}>{categoryLabels[spotlight.category]}</span>
    <h2>{spotlight.title}</h2><p>{spotlight.description}</p>
    <div className={styles.spotlightLinks}>{spotlight.links.map(link=><Link key={link.slug} href={`/${link.slug}`}>{link.title}</Link>)}</div>
    {spotlight.category==="finance"?<GrowthIllustration/>:<Icon className={styles.spotlightIllustration} name={spotlight.category} size={125} strokeWidth={1}/>}
  </article>;
}

export function FeaturedToolCard({tool}:{tool:FeaturedTool}) {
  return <CalculatorCard tool={tool} size="compact"/>;
}
