import Link from "next/link";
import {ChevronRight} from "lucide-react";
import {ToolIcon} from "@/components/ui/tool-icon";
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
  return <article className={`${styles.card} ${size==="compact"?styles.compact:""}`} data-calculator-card={tool.slug} data-category={tool.category} data-status={tool.status||"available"}>
    <Link className={styles.link} href={`/${tool.slug}`} aria-label={tool.title} prefetch={false}>
      <div className={styles.header}>
        <span className={styles.iconWrap}><ToolIcon slug={tool.slug} size={22}/></span>
        <Heading className={styles.title}>{tool.title}</Heading>
      </div>
      <p className={styles.description}>{tool.description}</p>
      <div className={styles.footer}>
        <div className={styles.metadata}>
          <span className={styles.category}>{categoryLabels[tool.category]}</span>
          {unavailable&&<span className={styles.availability}>Not available yet</span>}
          {tool.status==="directory"&&<span className={styles.collection}>Collection</span>}
        </div>
        <span className={styles.action} aria-hidden="true"><ChevronRight size={17}/></span>
      </div>
    </Link>
  </article>;
}
