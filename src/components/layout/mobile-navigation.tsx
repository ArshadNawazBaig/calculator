"use client";
import {useI18n} from "@/components/i18n/provider";
import {useEffect,useRef,useState} from "react";
import Link from "@/components/i18n/link";
import {ChevronRight,Menu,X} from "lucide-react";
import {isNavigationActive,type NavigationLink} from './navigation';
import styles from "./header.module.css";

export function MobileNavigation({links,secondaryLinks,pathname}:{links:NavigationLink[];secondaryLinks:NavigationLink[];pathname:string}){
 const {t}=useI18n();

  const [open,setOpen]=useState(false);
  const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!open)return;
    function dismiss(event:PointerEvent){if(event.target instanceof Node&&!root.current?.contains(event.target))setOpen(false);}
    function escape(event:KeyboardEvent){if(event.key==="Escape"){setOpen(false);trigger.current?.focus();}}
    function scroll(){setOpen(false);}
    // Match the desktop breakpoint in header.module.css.
    const desktop=window.matchMedia('(min-width: 1280px)');
    function resize(){if(desktop.matches)setOpen(false);}
    document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',escape);document.addEventListener('scroll',scroll);desktop.addEventListener('change',resize);
    return ()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape);document.removeEventListener('scroll',scroll);desktop.removeEventListener('change',resize);};
  },[open]);
  const renderLink=({label,href,icon: NavIcon}:NavigationLink,primary:boolean)=><Link key={href} href={href} className={primary?styles.mobileCard:styles.mobileLink} aria-current={isNavigationActive(pathname,href)?"page":undefined} onClick={()=>setOpen(false)}><NavIcon size={20} aria-hidden="true"/><span>{label}</span>{!primary&&<ChevronRight size={16} aria-hidden="true"/>}</Link>;
  return <div ref={root} className={styles.mobileControl} onBlur={event=>{if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
    <button ref={trigger} type="button" className={styles.mobileToggle} aria-label={open?t("Close navigation"):t("Open navigation")} aria-expanded={open} aria-controls="mobile-nav" onClick={()=>setOpen(!open)}>{open?<X size={23} aria-hidden="true"/>:<Menu size={23} aria-hidden="true"/>}</button>
    {open&&<>
      <div className={styles.mobileBackdrop} aria-hidden="true" onPointerDown={()=>setOpen(false)}/>
      <nav id="mobile-nav" aria-label={t("Mobile navigation")} className={styles.mobileNav}>
        <p className={styles.mobileLabel}>{t('Main navigation')}</p>
        <div className={styles.mobileGrid}>{links.map(link=>renderLink(link,true))}</div>
        <div className={styles.mobileSecondary}>{secondaryLinks.map(link=>renderLink(link,false))}</div>
      </nav>
    </>}
  </div>;
}
