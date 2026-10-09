"use client";
import {Search as SearchIcon} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {Button} from "@/components/ui/button";
export function Search({compact=false,initialQuery=""}:{compact?:boolean;initialQuery?:string}){const [query,setQuery]=useState(initialQuery);const router=useRouter();return <form className={`search ${compact?"search-compact":""}`} role="search" onSubmit={e=>{e.preventDefault();router.push(query.trim()?`/search?q=${encodeURIComponent(query.trim())}`:"/calculators");}}><SearchIcon aria-hidden="true" size={22}/><label className="sr-only" htmlFor={compact?"directory-search":"hero-search"}>Search calculators</label><input id={compact?"directory-search":"hero-search"} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="What would you like to calculate?" autoComplete="off"/><Button type="submit">Search</Button></form>;}
