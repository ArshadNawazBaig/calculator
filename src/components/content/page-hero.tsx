import type {ReactNode} from 'react';
import {Breadcrumbs,type BreadcrumbItem} from './breadcrumbs';
import styles from './page-hero.module.css';

type PageHeroProps={
  eyebrow:string;
  title:string;
  description?:string;
  highlight?:string;
  breadcrumbs?:BreadcrumbItem[];
  variant?:'default'|'system';
  children?:ReactNode;
};

/** Shared page introduction; preserves the complete title as a single accessible H1. */
export function PageHero({eyebrow,title,description,highlight,breadcrumbs,variant='default',children}:PageHeroProps){
  const accent=highlight??title.slice(title.lastIndexOf(' ')+1);
  const index=title.lastIndexOf(accent);
  return <section className={`${styles.hero}${variant==='system'?` ${styles.system}`:''}`} aria-labelledby="page-title" data-page-hero data-system-page={variant==='system'||undefined}>
    <div className="container">
      <Breadcrumbs items={breadcrumbs??[{label:title}]} tone="inverse" className={styles.breadcrumbs}/>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h1 id="page-title" className={styles.title}>{index<0?title:<>{title.slice(0,index)}<span>{accent}</span>{title.slice(index+accent.length)}</>}</h1>
      {description&&<p className={styles.description}>{description}</p>}
      {children&&<div className={styles.actions}>{children}</div>}
    </div>
  </section>;
}
