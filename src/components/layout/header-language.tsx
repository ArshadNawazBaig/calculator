"use client";
import {useState} from "react";
import {usePathname} from 'next/navigation';
import {languages, locales, localizedPath} from '@/lib/i18n/config';
import {useI18n} from '@/components/i18n/provider';
import {useHydrated} from '@/lib/use-hydrated';
import {Button,Dialog,DialogTrigger,Popover} from "react-aria-components";
import {Check,ChevronDown,Languages} from "lucide-react";
import styles from "./header.module.css";

export function HeaderLanguage(){
  const [open,setOpen]=useState(false);
  const {locale,t}=useI18n();
  const hydrated=useHydrated();
  const pathname=usePathname();
  return <DialogTrigger isOpen={open} onOpenChange={setOpen}>
    <Button isDisabled={!hydrated} className={styles.languageTrigger} aria-label={t('Language: {name}',{name:languages[locale].name})}>
      <Languages size={17} aria-hidden="true"/><span>{locale.toUpperCase()}</span><ChevronDown size={12} aria-hidden="true"/>
    </Button>
    <Popover placement="bottom end" offset={10} className={styles.languagePopover}>
      <Dialog aria-label={t('Website language')} className={styles.languageDialog}>
        <p>{t('Website language')}</p>
        <nav aria-label={t('Website language')}>{locales.map(language=><a key={language} className={styles.languageOption}
          href={localizedPath(pathname,language)} hrefLang={language} lang={language} dir={languages[language].direction}
          aria-current={language===locale?'true':undefined} onClick={event=>{
            // Full navigation changes the root document language and keeps search parameters.
            if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
            event.preventDefault();setOpen(false);
            window.location.assign(localizedPath(pathname,language)+window.location.search+window.location.hash);
          }}><span>{languages[language].name}</span>{language===locale&&<Check size={16} aria-hidden="true"/>}</a>)}</nav>
      </Dialog>
    </Popover>
  </DialogTrigger>;
}
