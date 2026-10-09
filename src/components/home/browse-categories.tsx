import Link from "next/link";
import {Icon} from "@/components/ui/icon";
import {browseCategories,categoryLabels} from "@/lib/home-content";
import {categories} from "@/lib/site";
import {ChevronRight} from "lucide-react";
import {SectionHeading} from "./section-heading";
import styles from "./home.module.css";

export function BrowseCategories() {
  return <section className={`container ${styles.section} ${styles.browse}`} aria-labelledby="browse-title">
    <SectionHeading id="browse-title" eyebrow="A tool for every part of life" title="What’s on your mind?" description="Explore the whole collection, one category at a time."/>
    <div className={styles.categoryGrid}>{browseCategories.map(category=><article className={styles.category} key={category.id}>
      <span className={styles.categoryIcon}><Icon name={category.icon} size={25}/></span>
      <h3><Link href={`/calculators/${category.id}`}>{categoryLabels[category.id]}</Link></h3>
      <p>{categories.find(item=>item.id===category.id)?.description}</p>
      <ul>{category.links.slice(0,2).map(link=><li key={link.slug}><Link href={`/${link.slug}`}>{link.title}</Link></li>)}</ul>
      <Link className={styles.categoryAll} href={`/calculators/${category.id}`}>Explore {categoryLabels[category.id].toLowerCase()}<ChevronRight size={15} aria-hidden="true"/></Link>
    </article>)}</div>
  </section>;
}
