"use client";
import {useState} from "react";
import {useI18n} from '@/components/i18n/provider';
import {useHydrated} from '@/lib/use-hydrated';
import {SearchHero} from "@/components/content/search-hero";
import {featuredTools,homeFilters,spotlights,type HomeCategory} from "@/lib/home-content";
import {FeaturedToolCard,SpotlightPanel} from "./featured-tools";
import {SectionHeading} from "./section-heading";
import styles from "./home.module.css";

export function HomeExplorer() {
  const {t}=useI18n();
  const hydrated=useHydrated();
  const [category,setCategory]=useState<HomeCategory>("all");
  return <>
    <SearchHero id="home-title" eyebrow={t("A little clarity goes a long way")} title={t("Find your answer.")} highlight={t("answer.")}
      description={t("Free calculators for life’s big and small decisions. From your next home to your everyday numbers.")}
      category={category==="all"?undefined:category} onClearCategory={()=>setCategory("all")}/>
    <section className={`container ${styles.section}`} aria-labelledby="featured-title">
      <SectionHeading id="featured-title" eyebrow={t("Your everyday toolkit")} title={t("Start with a calculator.")} link={category==='time'?{href:'/time',label:t('Explore time tools')}:category==='spin-wheels'?{href:"/spin-wheels",label:t("Explore spin wheels")}:{href:"/calculators",label:t("View all calculators")}}/>
      <div className={styles.filters} role="group" aria-label={t("Filter featured calculators")}>{homeFilters.map(filter=><button key={filter.id} type="button" disabled={!hydrated} aria-pressed={category===filter.id} aria-controls="featured-calculators" onClick={()=>setCategory(filter.id)}>{t(filter.label)}</button>)}</div>
      <div id="featured-calculators" className={styles.featuredLayout} aria-label={t("Featured tools")}>
        <div className={styles.featuredGrid}>{featuredTools[category].map(tool=><FeaturedToolCard key={tool.slug} tool={tool}/>)}</div>
        <SpotlightPanel spotlight={spotlights[category==="all"?"finance":category]}/>
      </div>
    </section>
  </>;
}
