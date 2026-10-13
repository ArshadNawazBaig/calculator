"use client";
import {useI18n} from "@/components/i18n/provider";
import Link from "@/components/i18n/link";
import {ChevronRight} from "lucide-react";
import {ToolIcon} from "@/components/ui/tool-icon";
import {categoryLabels,type CategoryId} from "@/lib/site";
import styles from "./calculator-card.module.css";
import {FavoriteButton} from '@/components/workspace/favorite-button';

export type CalculatorCardData={
  slug:string;
  title:string;
  category:CategoryId;
  description:string;
  status?:"available"|"unavailable"|"directory";
};

type CalculatorCardProps={tool:CalculatorCardData;size?:"regular"|"compact";headingLevel?:2|3};

export function CalculatorCard({tool,size="regular",headingLevel=3}:CalculatorCardProps) {
 const {t,locale,messages}=useI18n();

  const Heading=headingLevel===2?"h2":"h3";
  const unavailable=tool.status==="unavailable";
  return <article className={`${styles.card} ${locale!=='en'&&!messages[`description.${tool.slug}`]?styles.withoutDescription:''} ${size==="compact"?styles.compact:""}`} data-calculator-card={tool.slug} data-category={tool.category} data-status={tool.status||"available"}>
    <FavoriteButton slug={tool.slug} title={messages[`tool.${tool.slug}`]||tool.title} compact/>
    <Link className={styles.link} href={`/${tool.slug}`} aria-label={messages[`tool.${tool.slug}`]||tool.title} prefetch={false}>
      <div className={styles.header}>
        <span className={styles.iconWrap}><ToolIcon slug={tool.slug} size={22}/></span>
        <Heading className={styles.title}>{messages[`tool.${tool.slug}`]||tool.title}</Heading>
      </div>
      {(locale==='en'||messages[`description.${tool.slug}`])&&<p className={styles.description}>{locale==='en'?tool.description:messages[`description.${tool.slug}`]}</p>}
      <div className={styles.footer}>
        <div className={styles.metadata}>
          <span className={styles.category}>{t(categoryLabels[tool.category])}</span>
          {unavailable&&<span className={styles.availability}>{t("Not available yet")}</span>}
          {tool.status==="directory"&&<span className={styles.collection}>{t("Collection")}</span>}
        </div>
        <span className={styles.action} aria-hidden="true"><ChevronRight size={17}/></span>
      </div>
    </Link>
  </article>;
}
