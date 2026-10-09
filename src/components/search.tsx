"use client";
import {Search as SearchIcon,X} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect,useId,useMemo,useRef,useState,type KeyboardEvent} from "react";
import {Button} from "@/components/ui/button";
import {SearchSuggestions} from "@/components/search-suggestions";
import {searchCalculators} from "@/lib/calculator-search";
import type {CategoryId} from "@/lib/site";
import styles from "./search.module.css";

type SearchProps={compact?:boolean;initialQuery?:string;iconOnly?:boolean;keyboardShortcut?:boolean;category?:CategoryId;placeholder?:string;autoFocus?:boolean;onNavigate?:()=>void};
export function Search({compact=false,initialQuery="",iconOnly=false,keyboardShortcut=false,category,placeholder="What would you like to calculate?",autoFocus=false,onNavigate}:SearchProps) {
  const [query,setQuery]=useState(initialQuery);
  const [open,setOpen]=useState(false);
  const [activeIndex,setActiveIndex]=useState(-1);
  const inputRef=useRef<HTMLInputElement>(null);
  const formRef=useRef<HTMLFormElement>(null);
  const router=useRouter();
  const id=useId();
  const inputId=`calculator-search-${id}`;
  const listId=`calculator-suggestions-${id}`;
  const matches=useMemo(()=>searchCalculators(query,category),[query,category]);
  const suggestions=useMemo(()=>matches.slice(0,5),[matches]);
  const isOpen=open&&query.trim().length>0;
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
    if(!isOpen)return;
    function dismissOutside(event:PointerEvent) {
      if(event.target instanceof Node&&!formRef.current?.contains(event.target)){
        setOpen(false);setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown",dismissOutside);
    return ()=>document.removeEventListener("pointerdown",dismissOutside);
  },[isOpen]);

  function closeMenu(){setOpen(false);setActiveIndex(-1);}
  function openCalculator(slug:string){closeMenu();onNavigate?.();router.push(`/${slug}`);}
  function searchHref(allCategories=false){
    if(!query.trim())return category&&!allCategories?`/calculators/${category}`:"/calculators";
    const params=new URLSearchParams({q:query.trim()});
    if(category&&!allCategories)params.set("category",category);
    return `/search?${params}`;
  }
  function handleKeys(event:KeyboardEvent<HTMLInputElement>){
    if(event.nativeEvent.isComposing||event.keyCode===229)return;
    if(event.key==="Escape"){
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

  return <form ref={formRef} className={`search ${styles.root} ${compact?"search-compact":""} ${iconOnly?"search-icon-submit":""}`} role="search"
    onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))closeMenu();}}
    onSubmit={event=>{event.preventDefault();closeMenu();onNavigate?.();router.push(searchHref());}}>
    <SearchIcon aria-hidden="true" size={20}/><label className="sr-only" htmlFor={inputId}>Search calculators</label>
    <input ref={inputRef} id={inputId} type="search" role="combobox" aria-autocomplete="list" aria-haspopup="listbox"
      aria-expanded={isOpen} aria-controls={isOpen?listId:undefined} aria-activedescendant={activeItem?`${listId}-${activeIndex}`:undefined}
      aria-describedby={`${inputId}-help`} value={query} onChange={event=>{setQuery(event.target.value);setOpen(true);setActiveIndex(-1);}}
      onFocus={()=>setOpen(true)} onKeyDown={handleKeys} placeholder={placeholder} autoComplete="off" spellCheck={false} autoFocus={autoFocus}
      aria-keyshortcuts={keyboardShortcut?"/":undefined}/>
    {query&&<button type="button" className={styles.clear} aria-label="Clear search" onMouseDown={event=>event.preventDefault()} onClick={()=>{setQuery("");closeMenu();inputRef.current?.focus();}}><X size={16} aria-hidden="true"/></button>}
    <Button type="submit" aria-label="Search">{iconOnly?<SearchIcon size={21} aria-hidden="true"/>:"Search"}</Button>
    <span id={`${inputId}-help`} className="sr-only">Type to find calculators. Use the up and down arrow keys to choose a suggestion, Enter to open it, and Escape to close the suggestions.</span>
    <span className="sr-only" role="status" aria-atomic="true">{isOpen?(matches.length?`${matches.length} matching ${matches.length===1?"calculator":"calculators"}. ${suggestions.length} suggestions shown.`:"No matching calculators."):""}</span>
    {isOpen&&<SearchSuggestions id={listId} matches={suggestions} total={matches.length} activeIndex={activeIndex} category={category}
      onActive={setActiveIndex} onSelect={openCalculator} onBrowse={()=>{closeMenu();onNavigate?.();router.push(category?searchHref(true):"/calculators");}}/>}
  </form>;
}
