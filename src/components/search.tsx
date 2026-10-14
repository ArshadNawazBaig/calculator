"use client";
import {useI18n} from "@/components/i18n/provider";
import {Search as SearchIcon,X} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect,useId,useMemo,useRef,useState,type KeyboardEvent,type ReactNode} from "react";
import {Button} from "@/components/ui/button";
import {SearchSuggestions} from "@/components/search-suggestions";
import {searchCalculators} from "@/lib/calculator-search";
import {categoryHref,type ToolCategoryId} from "@/lib/site";
import {toolHref} from "@/lib/tool-listings";
import styles from "./search.module.css";

type SearchProps={compact?:boolean;initialQuery?:string;iconOnly?:boolean;keyboardShortcut?:boolean;category?:ToolCategoryId;placeholder?:string;autoFocus?:boolean;onNavigate?:()=>void;suggestionLayout?:'popover'|'inline';emptyContent?:ReactNode};
export function Search({compact=false,initialQuery="",iconOnly=false,keyboardShortcut=false,category,placeholder="What would you like to calculate?",autoFocus=false,onNavigate,suggestionLayout='popover',emptyContent}:SearchProps) {
 const {t,messages,href}=useI18n();

  const [query,setQuery]=useState(initialQuery);
  const [open,setOpen]=useState(false);
  const [activeIndex,setActiveIndex]=useState(-1);
  const inputRef=useRef<HTMLInputElement>(null);
  const formRef=useRef<HTMLFormElement>(null);
  const router=useRouter();
  const id=useId();
  const inputId=`calculator-search-${id}`;
  const listId=`calculator-suggestions-${id}`;
  const matches=useMemo(()=>searchCalculators(query,category,messages),[query,category,messages]);
  const suggestions=useMemo(()=>matches.slice(0,5),[matches]);
  const inline=suggestionLayout==='inline';
  const hasQuery=query.trim().length>0;
  const isOpen=(inline||open)&&hasQuery;
  const activeItem=isOpen?suggestions[activeIndex]:undefined;

  useEffect(()=>{
    if(!keyboardShortcut)return;
    function focusSearch(event:globalThis.KeyboardEvent) {
      const target=event.target;
      if(event.key!=="/"||event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return;
      if(target instanceof HTMLElement&&(target.isContentEditable||target.closest("input,textarea,select,button,[role='textbox'],[role='combobox']")))return;
      event.preventDefault();inputRef.current?.focus();
    }
    document.addEventListener("keydown",focusSearch);
    return ()=>document.removeEventListener("keydown",focusSearch);
  },[keyboardShortcut]);

  useEffect(()=>{
    if(!isOpen||inline)return;
    function dismissOutside(event:PointerEvent) {
      if(event.target instanceof Node&&!formRef.current?.contains(event.target)){
        setOpen(false);setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown",dismissOutside);
    return ()=>document.removeEventListener("pointerdown",dismissOutside);
  },[isOpen,inline]);

  function closeMenu(){setOpen(false);setActiveIndex(-1);}
  function openCalculator(slug:string){const tool=matches.find(item=>item.slug===slug);closeMenu();onNavigate?.();router.push(href(toolHref(tool||{slug})));}
  function searchHref(allCategories=false){
    if(!query.trim())return category&&!allCategories?categoryHref(category):"/calculators";
    const params=new URLSearchParams({q:query.trim()});
    if(category&&!allCategories)params.set("category",category);
    return `/search?${params}`;
  }
  function handleKeys(event:KeyboardEvent<HTMLInputElement>){
    if(event.nativeEvent.isComposing||event.keyCode===229)return;
    if(event.key==="Escape"){
      // The enclosing dialog owns dismissal for an integrated results list.
      if(inline)return;
      event.preventDefault();closeMenu();return;
    }
    if(event.key==="Tab"){closeMenu();return;}
    if(event.altKey||event.ctrlKey||event.metaKey)return;
    if((event.key==="ArrowDown"||event.key==="ArrowUp")&&suggestions.length){
      event.preventDefault();setOpen(true);
      setActiveIndex(current=>event.key==="ArrowDown"?(!isOpen?0:Math.min(current+1,suggestions.length-1)):(!isOpen||current<0?suggestions.length-1:Math.max(current-1,0)));
    }else if(event.key==="Enter"&&activeItem){
      event.preventDefault();openCalculator(activeItem.slug);
    }
  }

  return <form ref={formRef} className={`${styles.root} no-print`} role="search"
    onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))closeMenu();}}
    onSubmit={event=>{event.preventDefault();closeMenu();onNavigate?.();router.push(href(searchHref()));}}>
    <div className={`search ${compact?"search-compact":""} ${iconOnly?"search-icon-submit":""}`}>
    <SearchIcon aria-hidden="true" size={20}/><label className="sr-only" htmlFor={inputId}>{t("Search calculators")}</label>
    <input ref={inputRef} id={inputId} type="search" role="combobox" aria-autocomplete="list" aria-haspopup="listbox"
      aria-expanded={isOpen} aria-controls={isOpen?listId:undefined} aria-activedescendant={activeItem?`${listId}-${activeIndex}`:undefined}
      aria-describedby={`${inputId}-help`} value={query} onChange={event=>{setQuery(event.target.value);setOpen(true);setActiveIndex(-1);}}
      onFocus={()=>setOpen(true)} onKeyDown={handleKeys} placeholder={t(placeholder)} autoComplete="off" spellCheck={false} autoFocus={autoFocus}
      aria-keyshortcuts={keyboardShortcut?"/":undefined}/>
    {query&&<button type="button" className={styles.clear} aria-label={t("Clear search")} onMouseDown={event=>event.preventDefault()} onClick={()=>{setQuery("");closeMenu();inputRef.current?.focus();}}><X size={16} aria-hidden="true"/></button>}
    <Button type="submit" aria-label={t("Search")}>{iconOnly?<SearchIcon size={21} aria-hidden="true"/>:t("Search")}</Button>
    </div>
    <span id={`${inputId}-help`} className="sr-only">{t("Type to find calculators. Use the up and down arrow keys to choose a suggestion, Enter to open it, and Escape to close the suggestions.")}</span>
    <span className="sr-only" role="status" aria-atomic="true">{isOpen?(matches.length?t("Results: {count}",{count:matches.length}):t("No matching calculators")):""}</span>
    {isOpen&&<SearchSuggestions inline={inline} id={listId} matches={suggestions} total={matches.length} activeIndex={activeIndex} category={category}
      onActive={setActiveIndex} onSelect={openCalculator} onBrowse={()=>{closeMenu();onNavigate?.();router.push(href(category?searchHref(true):"/calculators"));}}/>}
    {!hasQuery&&emptyContent}
  </form>;
}
