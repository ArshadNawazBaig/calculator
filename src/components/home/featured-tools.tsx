"use client";
import Image from 'next/image';
import {useEffect, useRef, useState} from 'react';
import {useI18n} from '@/components/i18n/provider';
import Link from "@/components/i18n/link";
import {ChevronRight} from "lucide-react";
import {CalculatorCard} from "@/components/calculators/calculator-card";
import {categoryLabels,type FeaturedTool,type Spotlight} from "@/lib/home-content";
import styles from "./home.module.css";

export function SpotlightPanel({spotlight}:{spotlight:Spotlight}) {
  const {t}=useI18n();
  const growth=spotlight.category==='finance';
  return <article className={styles.spotlight} data-category={spotlight.category} data-theme-surface="dark">
    <div className={styles.spotlightCopy}><span className={styles.spotlightLabel}>{t('{category} in focus',{category:t(categoryLabels[spotlight.category])})}</span>
      <h3>{t(spotlight.title)}</h3><p>{t(spotlight.description)}</p></div>
    <div className={styles.spotlightLinks}>{spotlight.links.map(link=><Link key={link.slug} href={link.href || `/${link.slug}`}>{t(link.title)}<ChevronRight size={18} aria-hidden="true"/></Link>)}</div>
    <span className={growth?styles.growthIllustration:styles.spotlightIllustration} aria-hidden="true"><Image src={`/illustrations/home/${spotlight.category}.webp`} fill sizes={growth?'(max-width: 600px) calc(55vw - 20px), min(25vw, 300px)':'125px'} alt="" aria-hidden="true" loading="lazy"/></span>
  </article>;
}

export function FeaturedToolGrid({tools}: {tools: FeaturedTool[]}) {
  const grid = useRef<HTMLDivElement>(null);
  const [favoritesReady, setFavoritesReady] = useState(false);
  useEffect(() => {
    if (!grid.current || favoritesReady) return;
    if (typeof IntersectionObserver === 'undefined') {
      const frame = requestAnimationFrame(() => setFavoritesReady(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) setFavoritesReady(true);
    }, {rootMargin: '160px'});
    observer.observe(grid.current);
    return () => observer.disconnect();
  }, [favoritesReady]);
  return <div className={styles.featuredGrid} ref={grid} onFocusCapture={() => setFavoritesReady(true)}>
    {tools.map(tool => <CalculatorCard key={tool.slug} tool={tool} appearance="directory" headingLevel={4} favoritesReady={favoritesReady}/>)}
  </div>;
}
