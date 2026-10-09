import Link from "next/link";
import {Icon,toolIconName} from "@/components/ui/icon";
import {categoryLabels,type CategoryId} from "@/lib/site";
import styles from "./calculator-card.module.css";

export type CalculatorCardData={
  slug:string;
  title:string;
  category:CategoryId;
  description:string;
  status?:"available"|"unavailable"|"directory";
};

type CalculatorCardProps={tool:CalculatorCardData;size?:"regular"|"compact";headingLevel?:2|3};

export function CalculatorCard({tool,size="regular",headingLevel=3}:CalculatorCardProps) {
  const Heading=headingLevel===2?"h2":"h3";
  const unavailable=tool.status==="unavailable";
  const action=unavailable?"View availability":tool.status==="directory"?"Explore calculators":"Open calculator";
  return <article className={`${styles.card} ${size==="compact"?styles.compact:""}`} data-calculator-card={tool.slug} data-category={tool.category} data-status={tool.status||"available"}>
    <Link className={styles.link} href={`/${tool.slug}`} aria-label={tool.title} prefetch={false}>
      <div className={styles.top}><span className={styles.category}>{categoryLabels[tool.category]}</span><Icon className={styles.icon} name={toolIconName(tool.slug,tool.category)} size={30}/></div>
      <Heading className={styles.title}>{tool.title}</Heading>
      <p className={styles.description}>{tool.description}</p>
      <div className={styles.footer}>{unavailable&&<span className={styles.availability}>Not available yet</span>}<span className={styles.action}>{action}</span></div>
    </Link>
  </article>;
}
