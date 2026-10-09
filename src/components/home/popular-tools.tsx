import Link from "next/link";
import {CalculatorCard} from "@/components/calculators/calculator-card";
import {featuredTools} from "@/lib/home-content";
import styles from "./popular-tools.module.css";

export function PopularTools({title="Popular calculators"}:{title?:string}) {
  return <section className="popular-section" aria-labelledby="popular-calculators-title">
    <div className="section-heading"><h2 id="popular-calculators-title">{title}</h2><Link className="text-link" href="/calculators">View all calculators</Link></div>
    <div className={styles.grid}>{featuredTools.all.map(tool=><CalculatorCard key={tool.slug} tool={tool}/>)}</div>
  </section>;
}
