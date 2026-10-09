"use client";
import {Search as SearchIcon} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import type {CategoryId} from "@/lib/site";

type SearchProps={compact?:boolean;initialQuery?:string;iconOnly?:boolean;keyboardShortcut?:boolean;category?:CategoryId;placeholder?:string};
export function Search({compact=false,initialQuery="",iconOnly=false,keyboardShortcut=false,category,placeholder="What would you like to calculate?"}:SearchProps) {
  const [query,setQuery]=useState(initialQuery), inputRef=useRef<HTMLInputElement>(null),router=useRouter();
  useEffect(()=>{
    if(!keyboardShortcut)return;
    function focusSearch(event:KeyboardEvent) {
      const target=event.target;
      if(event.key!=="/"||event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return;
      if(target instanceof HTMLElement&&(target.isContentEditable||target.closest("input,textarea,select,button,[role='textbox']")))return;
      event.preventDefault();inputRef.current?.focus();
    }
    document.addEventListener("keydown",focusSearch);return ()=>document.removeEventListener("keydown",focusSearch);
  },[keyboardShortcut]);
  const id=compact?"directory-search":"hero-search";
  return <form className={`search ${compact?"search-compact":""} ${iconOnly?"search-icon-submit":""}`} role="search" onSubmit={event=>{
    event.preventDefault();
    if(!query.trim()){router.push(category?`/calculators/${category}`:"/calculators");return;}
    const params=new URLSearchParams({q:query.trim()});if(category)params.set("category",category);router.push(`/search?${params}`);
  }}>
    <SearchIcon aria-hidden="true" size={20}/><label className="sr-only" htmlFor={id}>Search calculators</label>
    <input ref={inputRef} id={id} type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder={placeholder} autoComplete="off" aria-keyshortcuts={keyboardShortcut?"/":undefined}/>
    <Button type="submit" aria-label="Search">{iconOnly?<SearchIcon size={21} aria-hidden="true"/>:"Search"}</Button>
  </form>;
}
