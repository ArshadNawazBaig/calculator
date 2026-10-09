import Link from "next/link";
import {Icon} from "@/components/ui/icon";
import {browseCategories,categoryLabels} from "@/lib/home-content";
import styles from "./home.module.css";

export function BrowseCategories() {
  return <section className={styles.browse} aria-labelledby="browse-title">
    <div className={styles.browseHeading}><h2 id="browse-title">Browse by category</h2><Link href="/calculators">All calculators</Link></div>
    <div className={styles.categoryGrid}>{browseCategories.map(category=><article className={styles.category} key={category.id}>
      <Icon name={category.icon} size={29} className={styles.categoryIcon}/>
      <h3><Link href={`/calculators/${category.id}`}>{categoryLabels[category.id]}</Link></h3>
      <ul>{category.links.map(link=><li key={link.slug}><Link href={`/${link.slug}`}>{link.title}</Link></li>)}</ul>
      <Link className={styles.categoryAll} href={`/calculators/${category.id}`}>View all {categoryLabels[category.id].toLowerCase()} calculators</Link>
    </article>)}</div>
  </section>;
}
