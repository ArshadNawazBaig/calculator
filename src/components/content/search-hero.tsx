"use client";
import Link from 'next/link';
import {Check,BookOpen,UserRoundCheck} from 'lucide-react';
import {Search} from '@/components/search';
import {categoryLabels,type CategoryId} from '@/lib/site';
import {Breadcrumbs,type BreadcrumbItem} from './breadcrumbs';
import styles from './search-hero.module.css';

type SearchHeroProps={
  id:string;
  eyebrow:string;
  title:string;
  highlight:string;
  description:string;
  breadcrumbs?:BreadcrumbItem[];
  category?:CategoryId;
  onClearCategory?:()=>void;
};

export function SearchHero({id,eyebrow,title,highlight,description,breadcrumbs,category,onClearCategory}:SearchHeroProps){
  const index=title.lastIndexOf(highlight);
  return <section className={styles.intro} aria-labelledby={id} data-search-hero>
    {breadcrumbs&&<div className={`container ${styles.heroBreadcrumbs}`}><Breadcrumbs items={breadcrumbs} tone="inverse"/></div>}
    <div className={`container ${styles.introInner}`}>
      <span className={styles.heroEyebrow}>{eyebrow}</span>
      <h1 id={id}>{index<0?title:<>{title.slice(0,index)}<span>{highlight}</span>{title.slice(index+highlight.length)}</>}</h1>
      <p className={styles.heroDescription}>{description}</p>
      <div className={styles.searchWrap}><Search keyboardShortcut category={category} placeholder="What would you like to calculate?"/></div>
      <div className={styles.heroFooter}>
        <div className={styles.searchUnder}>
          <div className={styles.quickSearches}><span>Try</span><Link href="/mortgage-calculator">Mortgage</Link><Link href="/bmi-calculator">BMI</Link><Link href="/compound-interest-calculator">Compound interest</Link></div>
          <span className={styles.searchHint}><kbd>/</kbd> to search</span>
        </div>
        <div className={styles.promises}><span><Check size={16} aria-hidden="true"/>Always free</span><span><UserRoundCheck size={16} aria-hidden="true"/>No account needed</span><span><BookOpen size={16} aria-hidden="true"/>Formulas explained</span></div>
      </div>
      {category&&<p className={styles.searchScope}>Searching {categoryLabels[category].toLowerCase()} calculators. {onClearCategory&&<button type="button" onClick={onClearCategory}>Search all categories</button>}</p>}
    </div>
  </section>;
}
