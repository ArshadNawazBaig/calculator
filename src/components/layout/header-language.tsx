"use client";
import {useState} from "react";
import {Button,Dialog,DialogTrigger,Popover} from "react-aria-components";
import {Check,ChevronDown,Languages} from "lucide-react";
import styles from "./header.module.css";

export function HeaderLanguage(){
  const [open,setOpen]=useState(false);
  return <DialogTrigger isOpen={open} onOpenChange={setOpen}>
    <Button className={styles.languageTrigger} aria-label="Language: English (United States)">
      <Languages size={17} aria-hidden="true"/><span>EN</span><ChevronDown size={12} aria-hidden="true"/>
    </Button>
    <Popover placement="bottom end" offset={10} className={styles.languagePopover}>
      <Dialog aria-label="Website language" className={styles.languageDialog}>
        <p>Website language</p>
        <Button className={styles.languageOption} aria-label="English (United States), selected" onPress={()=>setOpen(false)}><span>English (United States)</span><Check size={16} aria-hidden="true"/></Button>
      </Dialog>
    </Popover>
  </DialogTrigger>;
}
