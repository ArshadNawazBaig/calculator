import Link from "next/link";
import {Icon} from "@/components/ui/icon";
import {categories} from "@/lib/site";

export function CategoryCard({category}:{category:(typeof categories)[number]}) {
  return <article className="category-card">
    <div className="category-top">
      <span className="category-icon"><Icon name={category.icon} size={25}/></span>
      <h3><Link href={`/calculators/${category.id}`}>{category.name}</Link></h3>
    </div>
    <p>{category.description}</p>
    <div className="category-links">{category.links.map(link =>
      <Link key={link.slug} href={`/${link.slug}`}>{link.name}</Link>
    )}</div>
  </article>;
}
