"use client";
import {useI18n} from "@/components/i18n/provider";
import Link from "@/components/i18n/link";
import {ChevronRight} from "lucide-react";
import {ToolIcon} from "@/components/ui/tool-icon";
import {toolCategoryLabels,type ToolCategoryId} from "@/lib/site";
import styles from "./calculator-card.module.css";
import {FavoriteButton} from '@/components/workspace/favorite-button';

export type CalculatorCardData={
  slug:string;
  title:string;
  category:ToolCategoryId;
  description:string;
  href?:string;
  favorite?:boolean;
  status?:"available"|"unavailable"|"directory";
};

type CalculatorCardProps={tool:CalculatorCardData;size?:"regular"|"compact";headingLevel?:2|3|4;appearance?:"card"|"directory";showCategory?:boolean};

export function CalculatorCard({tool,size="regular",headingLevel=3,appearance="card",showCategory=false}:CalculatorCardProps) {
 const {t,locale,messages}=useI18n();

  const Heading=headingLevel===2?"h2":headingLevel===4?"h4":"h3";
  const unavailable=tool.status==="unavailable";
  const title=messages[`tool.${tool.slug}`]||tool.title;
  const description=locale==='en'?tool.description:messages[`description.${tool.slug}`];
  if (appearance==="directory") return <article className={`${styles.directoryRow} ${tool.favorite!==false?styles.hasFavorite:""}`} data-calculator-card={tool.slug} data-category={tool.category} data-status={tool.status||"available"}>
    {tool.favorite!==false&&<FavoriteButton slug={tool.slug} title={title} compact className={styles.directoryFavorite}/>}
    <Link className={styles.directoryLink} href={tool.href||`/${tool.slug}`} aria-label={title}>
      <span className={styles.directoryIcon}><ToolIcon slug={tool.slug} size={17}/></span>
      <div className={styles.directoryCopy}>
        <Heading className={styles.directoryTitle}>{title}</Heading>
        {(description||showCategory)&&<p className={styles.directoryDescription}>{showCategory&&<span>{t(toolCategoryLabels[tool.category])}{description&&' · '}</span>}{description}</p>}
        {unavailable&&<span className={styles.availability}>{t("Not available yet")}</span>}
        {tool.status==="directory"&&<span className={styles.collection}>{t("Collection")}</span>}
      </div>
    </Link>
  </article>;
  return <article className={`${styles.card} ${locale!=='en'&&!messages[`description.${tool.slug}`]?styles.withoutDescription:''} ${size==="compact"?styles.compact:""}`} data-calculator-card={tool.slug} data-category={tool.category} data-status={tool.status||"available"}>
    {tool.favorite !== false && <FavoriteButton slug={tool.slug} title={title} compact/>}
    <Link className={styles.link} href={tool.href || `/${tool.slug}`} aria-label={title}>
      <div className={styles.header}>
        <span className={styles.iconWrap}><ToolIcon slug={tool.slug} size={22}/></span>
        <Heading className={styles.title}>{title}</Heading>
      </div>
      {(locale==='en'||messages[`description.${tool.slug}`])&&<p className={styles.description}>{locale==='en'?tool.description:messages[`description.${tool.slug}`]}</p>}
      <div className={styles.footer}>
        <div className={styles.metadata}>
          <span className={styles.category}>{t(toolCategoryLabels[tool.category])}</span>
          {unavailable&&<span className={styles.availability}>{t("Not available yet")}</span>}
          {tool.status==="directory"&&<span className={styles.collection}>{t("Collection")}</span>}
        </div>
        <span className={styles.action} aria-hidden="true"><ChevronRight size={17}/></span>
      </div>
    </Link>
  </article>;
}
