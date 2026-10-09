import Link from "next/link";
import {ChevronRight} from "lucide-react";
import {Icon} from "@/components/ui/icon";
import {categories} from "@/lib/site";
export function CategoryCard({category}:{category:(typeof categories)[number]}){return <article className="category-card"><div className="category-top"><Icon name={category.icon} size={32}/><h3><Link href={`/calculators/${category.id}`}>{category.name}</Link></h3><ChevronRight size={17}/></div><p>{category.description}</p><div className="category-links">{category.links.map(link=><Link key={link.slug} href={`/${link.slug}`}>{link.name}<ChevronRight size={14}/></Link>)}</div></article>;}
