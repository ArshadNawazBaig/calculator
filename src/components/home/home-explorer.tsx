"use client";
import {useState} from "react";
import {Search} from "@/components/search";
import {featuredTools,homeFilters,spotlights,type HomeCategory} from "@/lib/home-content";
import {FeaturedToolCard,SpotlightPanel} from "./featured-tools";
import styles from "./home.module.css";

export function HomeExplorer() {
  const [category,setCategory]=useState<HomeCategory>("all");
  return <>
    <section className={styles.intro} aria-labelledby="home-title">
      <h1 id="home-title">Find your answer.</h1>
      <p>Free calculators for life’s big and small decisions.</p>
      <div className={styles.searchWrap}><Search iconOnly keyboardShortcut category={category==="all"?undefined:category} placeholder="Search calculators (e.g. mortgage, BMI, percentage...)"/><span className={styles.searchHint}>Press <kbd>/</kbd> to search</span></div>
      <div className={styles.filters} role="group" aria-label="Filter featured calculators">{homeFilters.map(filter=><button key={filter.id} type="button" aria-pressed={category===filter.id} aria-controls="featured-calculators" onClick={()=>setCategory(filter.id)}>{filter.label}</button>)}</div>
    </section>
    <section id="featured-calculators" className={styles.featuredLayout} aria-label={`${category==="all"?"Popular":homeFilters.find(f=>f.id===category)?.label} calculators`}>
      <SpotlightPanel spotlight={spotlights[category==="all"?"finance":category]}/>
      <div className={styles.featuredGrid}>{featuredTools[category].map(tool=><FeaturedToolCard key={tool.slug} tool={tool}/>)}</div>
    </section>
  </>;
}
