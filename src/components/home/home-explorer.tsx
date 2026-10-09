"use client";
import {useState} from "react";
import Link from "next/link";
import {Check,BookOpen,UserRoundCheck} from "lucide-react";
import {Search} from "@/components/search";
import {featuredTools,homeFilters,spotlights,type HomeCategory} from "@/lib/home-content";
import {FeaturedToolCard,SpotlightPanel} from "./featured-tools";
import {SectionHeading} from "./section-heading";
import styles from "./home.module.css";

export function HomeExplorer() {
  const [category,setCategory]=useState<HomeCategory>("all");
  return <>
    <section className={styles.intro} aria-labelledby="home-title">
      <div className={`container ${styles.introInner}`}>
        <span className={styles.heroEyebrow}>A little clarity goes a long way</span>
        <h1 id="home-title">Find your answer.</h1>
        <p>Free calculators for life’s big and small decisions.<br className={styles.desktopBreak}/>{" "}From your next home to your everyday numbers.</p>
        <div className={styles.searchWrap}><Search keyboardShortcut category={category==="all"?undefined:category} placeholder="What would you like to calculate?"/></div>
        <div className={styles.searchUnder}>
          <div className={styles.quickSearches}><span>Try</span><Link href="/mortgage-calculator">Mortgage</Link><Link href="/bmi-calculator">BMI</Link><Link href="/compound-interest-calculator">Compound interest</Link></div>
          <span className={styles.searchHint}><kbd>/</kbd> to search</span>
        </div>
        {category!=="all"&&<p className={styles.searchScope}>Searching {homeFilters.find(filter=>filter.id===category)?.label.toLowerCase()} calculators. <button type="button" onClick={()=>setCategory("all")}>Search all categories</button></p>}
        <div className={styles.promises}><span><Check size={16} aria-hidden="true"/>Always free</span><span><UserRoundCheck size={16} aria-hidden="true"/>No account needed</span><span><BookOpen size={16} aria-hidden="true"/>Formulas explained</span></div>
      </div>
    </section>
    <section className={`container ${styles.section}`} aria-labelledby="featured-title">
      <SectionHeading id="featured-title" eyebrow="Your everyday toolkit" title="Start with a calculator." description="A few useful places to begin. Choose a topic to find your next tool." link={{href:"/calculators",label:"View all calculators"}}/>
      <div className={styles.filters} role="group" aria-label="Filter featured calculators">{homeFilters.map(filter=><button key={filter.id} type="button" aria-pressed={category===filter.id} aria-controls="featured-calculators" onClick={()=>setCategory(filter.id)}>{filter.label}</button>)}</div>
      <div id="featured-calculators" className={styles.featuredLayout} aria-label={`${category==="all"?"Popular":homeFilters.find(f=>f.id===category)?.label} calculators`}>
        <div className={styles.featuredGrid}>{featuredTools[category].map(tool=><FeaturedToolCard key={tool.slug} tool={tool}/>)}</div>
        <SpotlightPanel spotlight={spotlights[category==="all"?"finance":category]}/>
      </div>
    </section>
  </>;
}
