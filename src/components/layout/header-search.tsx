"use client";
import {useI18n} from "@/components/i18n/provider";
import {useEffect,useState} from "react";
import Link from "@/components/i18n/link";
import {Button,Dialog,DialogTrigger,Heading,Modal,ModalOverlay} from "react-aria-components";
import {ChevronRight,Search as SearchIcon,X} from "lucide-react";
import {Search} from "@/components/search";
import {ToolIcon} from "@/components/ui/tool-icon";
import styles from "./header.module.css";

const popular=[
  {slug:"mortgage-calculator",label:"Mortgage calculator",description:"Plan your monthly home payment.",category:"finance"},
  {slug:"compound-interest-calculator",label:"Compound interest",description:"See how your savings could grow.",category:"finance"},
  {slug:"bmi-calculator",label:"BMI calculator",description:"Check your body mass index.",category:"health"},
  {slug:"age-calculator",label:"Age calculator",description:"Find an age in years, months, and days.",category:"everyday"},
] as const;

export function HeaderSearch(){
 const {t,locale}=useI18n();

  const [open,setOpen]=useState(false);
  useEffect(()=>{
    function shortcut(event:KeyboardEvent){if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"&&!event.isComposing){event.preventDefault();setOpen(value=>!value);}}
    document.addEventListener("keydown",shortcut);return ()=>document.removeEventListener("keydown",shortcut);
  },[]);
  return <DialogTrigger isOpen={open} onOpenChange={setOpen}>
    <Button className={styles.searchTrigger} aria-label={t("Search calculators")} aria-keyshortcuts="Control+k Meta+k"><SearchIcon size={18} aria-hidden="true"/></Button>
    <ModalOverlay isDismissable className={styles.searchOverlay}>
      <Modal className={styles.searchModal}>
        <Dialog className={styles.searchDialog}>
          <div className={styles.searchHeading}><Heading slot="title">{t("Find a calculator")}</Heading><Button slot="close" className={styles.closeSearch} aria-label={t("Close search")}><X size={20} aria-hidden="true"/></Button></div>
          <Search autoFocus suggestionLayout="inline" onNavigate={()=>setOpen(false)} placeholder={t("Search calculators…")} emptyContent={<>
          <p className={styles.popularLabel}>{t("Popular calculators")}</p>
          <div className={styles.popularLinks}>{popular.map(tool=><Link key={tool.slug} href={`/${tool.slug}`} onClick={()=>setOpen(false)}><span className={styles.popularIcon}><ToolIcon slug={tool.slug} size={20}/></span><span><strong>{locale==='en'?tool.label:t(`tool.${tool.slug}`)}</strong>{locale==='en'&&<small>{tool.description}</small>}</span><ChevronRight size={16} aria-hidden="true"/></Link>)}</div>
          <div className={styles.searchFooter}><span>{t("Free calculators for money, health, math, and everyday life.")}</span><span><kbd>Esc</kbd> {t("to close")}</span></div>
          </>}/>
        </Dialog>
      </Modal>
    </ModalOverlay>
  </DialogTrigger>;
}
