"use client";
import {useState} from "react";
import {SearchHero} from "@/components/content/search-hero";
import {featuredTools,homeFilters,spotlights,type HomeCategory} from "@/lib/home-content";
import {FeaturedToolCard,SpotlightPanel} from "./featured-tools";
import {SectionHeading} from "./section-heading";
import styles from "./home.module.css";

export function HomeExplorer() {
  const [category,setCategory]=useState<HomeCategory>("all");
  return <>
    <SearchHero id="home-title" eyebrow="A little clarity goes a long way" title="Find your answer." highlight="answer."
      description="Free calculators for life’s big and small decisions. From your next home to your everyday numbers."
      category={category==="all"?undefined:category} onClearCategory={()=>setCategory("all")}/>
    <section className={`container ${styles.section}`} aria-labelledby="featured-title">
      <SectionHeading id="featured-title" eyebrow="Your everyday toolkit" title="Start with a calculator." link={category==='spin-wheels'?{href:"/spin-wheels",label:"Explore spin wheels"}:{href:"/calculators",label:"View all calculators"}}/>
      <div className={styles.filters} role="group" aria-label="Filter featured calculators">{homeFilters.map(filter=><button key={filter.id} type="button" aria-pressed={category===filter.id} aria-controls="featured-calculators" onClick={()=>setCategory(filter.id)}>{filter.label}</button>)}</div>
      <div id="featured-calculators" className={styles.featuredLayout} aria-label={category==='spin-wheels'?'Featured spin wheels':`${category==="all"?"Popular":homeFilters.find(f=>f.id===category)?.label} calculators`}>
        <div className={styles.featuredGrid}>{featuredTools[category].map(tool=><FeaturedToolCard key={tool.slug} tool={tool}/>)}</div>
        <SpotlightPanel spotlight={spotlights[category==="all"?"finance":category]}/>
      </div>
    </section>
  </>;
}
