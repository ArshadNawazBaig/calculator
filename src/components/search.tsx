"use client";
import {useI18n} from "@/components/i18n/provider";
import {Search as SearchIcon,X} from "lucide-react";
import {useCallback,useEffect,useId,useMemo,useRef,useState,type KeyboardEvent,type ReactNode} from "react";
import {Button} from "@/components/ui/button";
import {SearchSuggestions} from "@/components/search-suggestions";
import {categoryHref,type ToolCategoryId} from "@/lib/site";
import {toolHref} from "@/lib/catalog-paths";
import styles from "./search.module.css";

type SearchProps={compact?:boolean;initialQuery?:string;iconOnly?:boolean;keyboardShortcut?:boolean;category?:ToolCategoryId;placeholder?:string;autoFocus?:boolean;onNavigate?:()=>void;suggestionLayout?:'popover'|'inline';emptyContent?:ReactNode};
export function Search({compact=false,initialQuery="",iconOnly=false,keyboardShortcut=false,category,placeholder="What would you like to calculate?",autoFocus=false,onNavigate,suggestionLayout='popover',emptyContent}:SearchProps) {
 const {t,messages,href}=useI18n();

  const [query,setQuery]=useState(initialQuery);
  const [open,setOpen]=useState(false);
  const [activeIndex,setActiveIndex]=useState(-1);
  const [searchIndex, setSearchIndex] = useState<typeof import('@/lib/calculator-search') | null>(null);
  const inputRef=useRef<HTMLInputElement>(null);
  // Preserve native input entered before hydration; state drives suggestions only.
  const captureInput=useCallback((input:HTMLInputElement|null)=>{inputRef.current=input;if(input)setQuery(input.value);},[]);
  const formRef=useRef<HTMLFormElement>(null);
  const id=useId();
  const inputId=`calculator-search-${id}`;
  const listId=`calculator-suggestions-${id}`;
  const inline=suggestionLayout==='inline';
  const hasQuery=query.trim().length>0;
  const needsIndex = open || hasQuery || inline;
  useEffect(() => {
    if (!needsIndex || searchIndex) return;
    let active = true;
    import('@/lib/calculator-search').then(module => {
      if (active) setSearchIndex(module);
    }).catch(() => { /* The search form can still navigate to the full results page. */ });
    return () => { active = false; };
  }, [needsIndex, searchIndex]);
  const matches=useMemo(()=>searchIndex?.searchCalculators(query,category,messages) ?? [],[query,category,messages,searchIndex]);
  const suggestions=useMemo(()=>matches.slice(0,5),[matches]);
  const isOpen=(inline||open)&&hasQuery&&searchIndex!==null;
  const selectedIndex = Math.min(activeIndex, suggestions.length - 1);
  const activeItem=isOpen?suggestions[selectedIndex]:undefined;

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
  function openCalculator(slug:string){const tool=matches.find(item=>item.slug===slug);closeMenu();onNavigate?.();window.location.assign(href(toolHref(tool||{slug})));}
  function searchHref(allCategories=false,enteredQuery=query){
    if(!enteredQuery.trim())return category&&!allCategories?categoryHref(category):"/calculators";
    const params=new URLSearchParams({q:enteredQuery.trim()});
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
    if (!searchIndex && hasQuery && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();setOpen(true);setActiveIndex(event.key === 'ArrowDown' ? 0 : 4);return;
    }
    if((event.key==="ArrowDown"||event.key==="ArrowUp")&&suggestions.length){
      event.preventDefault();setOpen(true);
      setActiveIndex(current=>event.key==="ArrowDown"?(!isOpen?0:Math.min(current+1,suggestions.length-1)):(!isOpen||current<0?suggestions.length-1:Math.max(current-1,0)));
    }else if(event.key==="Enter"&&activeItem){
      event.preventDefault();openCalculator(activeItem.slug);
    }
  }

  return <form ref={formRef} className={`${styles.root} no-print`} role="search" action={href('/search')} method="get"
    onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))closeMenu();}}
    onSubmit={event=>{event.preventDefault();const enteredQuery=String(new FormData(event.currentTarget).get('q')||'');closeMenu();onNavigate?.();window.location.assign(href(searchHref(false,enteredQuery)));}}>
    {category&&<input type="hidden" name="category" value={category}/>}
    <div className={`search ${compact?"search-compact":""} ${iconOnly?"search-icon-submit":""}`}>
    <SearchIcon aria-hidden="true" size={20}/><label className="sr-only" htmlFor={inputId}>{t("Search calculators")}</label>
    <input ref={captureInput} id={inputId} name="q" type="search" role="combobox" aria-autocomplete="list" aria-haspopup="listbox"
      aria-expanded={isOpen} aria-controls={isOpen?listId:undefined} aria-activedescendant={activeItem?`${listId}-${selectedIndex}`:undefined}
      aria-describedby={`${inputId}-help`} defaultValue={initialQuery} onChange={event=>{setQuery(event.target.value);setOpen(true);setActiveIndex(-1);}}
      onFocus={()=>setOpen(true)} onKeyDown={handleKeys} placeholder={t(placeholder)} autoComplete="off" spellCheck={false} autoFocus={autoFocus}
      aria-keyshortcuts={keyboardShortcut?"/":undefined}/>
    {query&&<button type="button" className={styles.clear} aria-label={t("Clear search")} onMouseDown={event=>event.preventDefault()} onClick={()=>{if(inputRef.current)inputRef.current.value='';setQuery("");closeMenu();inputRef.current?.focus();}}><X size={16} aria-hidden="true"/></button>}
    <Button type="submit" aria-label={t("Search")}>{iconOnly?<SearchIcon size={21} aria-hidden="true"/>:t("Search")}</Button>
    </div>
    <span id={`${inputId}-help`} className="sr-only">{t("Type to find calculators. Use the up and down arrow keys to choose a suggestion, Enter to open it, and Escape to close the suggestions.")}</span>
    <span className="sr-only" role="status" aria-atomic="true">{isOpen?(matches.length?t("Results: {count}",{count:matches.length}):t("No matching calculators")):""}</span>
    {isOpen&&<SearchSuggestions inline={inline} id={listId} matches={suggestions} total={matches.length} activeIndex={selectedIndex} category={category}
      onActive={setActiveIndex} onSelect={openCalculator} onBrowse={()=>{closeMenu();onNavigate?.();window.location.assign(href(category?searchHref(true):"/calculators"));}}/>}
    {!hasQuery&&emptyContent}
  </form>;
}
