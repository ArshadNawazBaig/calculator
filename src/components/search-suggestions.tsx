"use client";
import {useI18n} from "@/components/i18n/provider";
import {useEffect,useRef} from "react";
import {ChevronRight,SearchX} from "lucide-react";
import {ToolIcon} from "@/components/ui/tool-icon";
import {categoryLabels,type CategoryId} from "@/lib/site";
import type {CatalogEntry} from "@/lib/calculators/types";
import styles from "./search.module.css";

type SearchSuggestionsProps={
  id:string;
  matches:CatalogEntry[];
  total:number;
  activeIndex:number;
  category?:CategoryId;
  onActive:(index:number)=>void;
  onSelect:(slug:string)=>void;
  onBrowse:()=>void;
};

export function SearchSuggestions({id,matches,total,activeIndex,category,onActive,onSelect,onBrowse}:SearchSuggestionsProps) {
 const {t,locale}=useI18n();

  const listRef=useRef<HTMLUListElement>(null);
  useEffect(()=>{
    const list=listRef.current;
    if(list&&activeIndex<0){list.scrollTop=0;return;}
    const option=list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if(!list||!option)return;
    const top=option.offsetTop;
    if(top<list.scrollTop)list.scrollTop=top;
    else if(top+option.offsetHeight>list.scrollTop+list.clientHeight)list.scrollTop=top+option.offsetHeight-list.clientHeight;
  },[activeIndex,matches]);

  return <div className={styles.menu}>
    <div className={styles.menuHeading}><span id={`${id}-label`}>{t("Suggested calculators")}</span>{total>0&&<span>{total>matches.length?t("{shown} of {total}",{shown:matches.length,total}):t("Results: {count}",{count:total})}</span>}</div>
    <ul ref={listRef} id={id} role="listbox" aria-labelledby={`${id}-label`} className={styles.list}>
      {matches.map((tool,index)=><li key={tool.slug} id={`${id}-${index}`} role="option" aria-selected={activeIndex===index} tabIndex={-1} className={styles.option}
        onMouseDown={event=>event.preventDefault()} onPointerMove={event=>{if(event.pointerType==="mouse")onActive(index);}} onClick={()=>onSelect(tool.slug)}>
        <span className={styles.optionIcon}><ToolIcon slug={tool.slug} size={21}/></span>
        <span className={styles.optionCopy}><span className={styles.optionTitle}>{locale==='en'?tool.title:t(`tool.${tool.slug}`)}</span><span className={styles.optionCategory}>{t(categoryLabels[tool.category])}<span aria-hidden="true"> · </span>{t(tool.subcategory)}</span></span>
        <ChevronRight className={styles.chevron} size={16} aria-hidden="true"/>
      </li>)}
    </ul>
    {!matches.length&&<div className={styles.empty}><SearchX size={24} aria-hidden="true"/><strong>{category?t("No matches in {category}",{category:t(categoryLabels[category]).toLowerCase()}):t("No calculators found")}</strong><p>{t("Try a shorter name, such as “loan” or “date”.")}</p></div>}
    <div className={styles.menuFooter}>
      <span className={styles.keyHint}><kbd>↑</kbd><kbd>↓</kbd> {t("to navigate")}<span>·</span><kbd>↵</kbd> {t("to open")}</span>
      {total>0?<button type="submit" tabIndex={-1}>{t("View all results")}<ChevronRight size={15} aria-hidden="true"/></button>:<button type="button" tabIndex={-1} onClick={onBrowse}>{category?t("Search all categories"):t("Browse all calculators")}<ChevronRight size={15} aria-hidden="true"/></button>}
    </div>
  </div>;
}
