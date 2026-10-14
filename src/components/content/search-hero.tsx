"use client";
import {useI18n} from "@/components/i18n/provider";
import Link from '@/components/i18n/link';
import {Check,BookOpen,UserRoundCheck} from 'lucide-react';
import {Search} from '@/components/search';
import {toolCategoryLabels as categoryLabels,type ToolCategoryId} from '@/lib/site';
import {Breadcrumbs,type BreadcrumbItem} from './breadcrumbs';
import styles from './search-hero.module.css';

type SearchHeroProps={
  id:string;
  eyebrow:string;
  title:string;
  highlight:string;
  description:string;
  breadcrumbs?:BreadcrumbItem[];
  compact?:boolean;
  category?:ToolCategoryId;
  onClearCategory?:()=>void;
};

export function SearchHero({id,eyebrow,title,highlight,description,breadcrumbs,category,onClearCategory,compact=false}:SearchHeroProps){
 const {t,locale}=useI18n();

  const index=title.lastIndexOf(highlight);
  return <section className={`${styles.intro}${compact?` ${styles.compact}`:""}`} aria-labelledby={id} data-search-hero data-theme-surface="dark">
    {breadcrumbs&&<div className={`container ${styles.heroBreadcrumbs}`}><Breadcrumbs items={breadcrumbs} tone="inverse"/></div>}
    <div className={`container ${styles.introInner}`}>
      <span className={styles.heroEyebrow}>{eyebrow}</span>
      <h1 id={id}>{index<0?title:<>{title.slice(0,index)}<span>{highlight}</span>{title.slice(index+highlight.length)}</>}</h1>
      <p className={styles.heroDescription}>{description}</p>
      <div className={styles.searchWrap}><Search keyboardShortcut category={category} placeholder={t("Search calculators…")}/></div>
      <div className={styles.heroFooter}>
        <div className={styles.searchUnder}>
          <div className={styles.quickSearches}><span>{t("Try")}</span><Link href="/mortgage-calculator">{locale==='en'?'Mortgage':t('tool.mortgage-calculator')}</Link><Link href="/bmi-calculator">{t("BMI")}</Link><Link href="/compound-interest-calculator">{locale==='en'?'Compound interest':t('tool.compound-interest-calculator')}</Link></div>
          <span className={styles.searchHint}><kbd>/</kbd> {t("to search")}</span>
        </div>
        <div className={styles.promises}><span><Check size={16} aria-hidden="true"/>{t("Always free")}</span><span><UserRoundCheck size={16} aria-hidden="true"/>{t("No account needed")}</span><span><BookOpen size={16} aria-hidden="true"/>{t("Formulas explained")}</span></div>
      </div>
      {category&&<p className={styles.searchScope}>{category==='spin-wheels'?t('Spin wheels'):t("Searching {category} calculators.",{category:t(categoryLabels[category]).toLowerCase()})} {onClearCategory&&<button type="button" onClick={onClearCategory}>{t("Search all categories")}</button>}</p>}
    </div>
  </section>;
}
