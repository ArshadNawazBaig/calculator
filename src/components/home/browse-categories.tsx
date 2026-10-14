import {timeTools} from '@/lib/time/tools';
import Link from "@/components/i18n/link";
import {Icon} from "@/components/ui/icon";
import {toolCategories,toolCategoryLabels,categoryHref} from "@/lib/site";
import {wheelHref} from "@/lib/spin-wheels/catalog";
import {ChevronRight} from "lucide-react";
import {SectionHeading} from "./section-heading";
import styles from "./home.module.css";

export function BrowseCategories() {
  return <section className={`container ${styles.section} ${styles.browse}`} aria-labelledby="browse-title">
    <SectionHeading id="browse-title" eyebrow="A tool for every part of life" title="What’s on your mind?" description="Explore the whole collection, one category at a time."/>
    <div className={styles.categoryGrid}>{toolCategories.map(category=><article className={styles.category} data-category={category.id} key={category.id}>
      <span className={styles.categoryIcon}><Icon name={category.icon} size={25}/></span>
      <h3><Link href={category.href}>{toolCategoryLabels[category.id]}</Link></h3>
      <p>{category.description}</p>
      <ul>{category.links.slice(0,2).map(link=><li key={link.slug}><Link href={category.id==='time'?(timeTools.find(tool=>tool.slug===link.slug)?.href||'/time'):category.id==='spin-wheels'?wheelHref(link.slug):`/${link.slug}`}>{link.name}</Link></li>)}</ul>
      <Link className={styles.categoryAll} href={categoryHref(category.id)}>Explore {toolCategoryLabels[category.id].toLowerCase()}<ChevronRight size={15} aria-hidden="true"/></Link>
    </article>)}</div>
  </section>;
}
