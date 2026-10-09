"use client";
import {useI18n} from "@/components/i18n/provider";
import {useEffect,useRef,useState} from "react";
import Link from "@/components/i18n/link";
import {Menu,X} from "lucide-react";
import styles from "./header.module.css";

export function MobileNavigation({links,pathname}:{links:{label:string;href:string}[];pathname:string}){
 const {t}=useI18n();

  const [open,setOpen]=useState(false);
  const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!open)return;
    function dismiss(event:PointerEvent){if(event.target instanceof Node&&!root.current?.contains(event.target))setOpen(false);}
    function escape(event:KeyboardEvent){if(event.key==="Escape"){setOpen(false);trigger.current?.focus();}}
    const desktop=window.matchMedia('(min-width: 1001px)');
    function resize(){if(desktop.matches)setOpen(false);}
    document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',escape);desktop.addEventListener('change',resize);
    return ()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape);desktop.removeEventListener('change',resize);};
  },[open]);
  return <div ref={root} className={styles.mobileControl}>
    <button ref={trigger} type="button" className={styles.mobileToggle} aria-label={open?t("Close navigation"):t("Open navigation")} aria-expanded={open} aria-controls="mobile-nav" onClick={()=>setOpen(!open)}>{open?<X size={23} aria-hidden="true"/>:<Menu size={23} aria-hidden="true"/>}</button>
    {open&&<nav id="mobile-nav" aria-label={t("Mobile navigation")} className={styles.mobileNav}>
      {links.map(({label,href})=><Link key={href} href={href} aria-current={pathname===href?"page":undefined} onClick={()=>setOpen(false)}>{label}</Link>)}
    </nav>}
  </div>;
}
