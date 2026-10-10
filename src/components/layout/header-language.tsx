"use client";
import {useMemo,useState} from "react";
import {usePathname} from 'next/navigation';
import {languages, locales, localizedPath} from '@/lib/i18n/config';
import {useI18n} from '@/components/i18n/provider';
import {useHydrated} from '@/lib/use-hydrated';
import {usePreferences} from '@/components/i18n/preferences-provider';
import {CurrencySelect} from '@/components/i18n/currency-select';
import {countryCurrencies,isCountry} from '@/lib/i18n/preferences';
import {Dropdown} from '@/components/ui/dropdown';
import {Button,Dialog,DialogTrigger,Popover} from "react-aria-components";
import {Check,ChevronDown,Languages} from "lucide-react";
import styles from "./header.module.css";

export function HeaderLanguage(){
  const [open,setOpen]=useState(false);
  const {locale,t}=useI18n();
  const {country,currency,setCountry,setCurrency,reset,custom}=usePreferences();
  const countries=useMemo(()=>{
    const names=new Intl.DisplayNames([locale],{type:'region'});
    return Object.keys(countryCurrencies).map(code=>({value:code,label:names.of(code)||code})).sort((a,b)=>a.label.localeCompare(b.label,locale));
  },[locale]);
  const hydrated=useHydrated();
  const pathname=usePathname();
  return <DialogTrigger isOpen={open} onOpenChange={setOpen}>
    <Button isDisabled={!hydrated} className={styles.languageTrigger} aria-label={t('Language: {name}',{name:languages[locale].name})}>
      <Languages size={17} aria-hidden="true"/><span>{locale.toUpperCase()}</span><span className={styles.currencyCode}>· {currency}</span><ChevronDown size={12} aria-hidden="true"/>
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
        <div className={styles.regionPreferences}>
          <div><label htmlFor="preferred-country">{t('Country / region')}</label><Dropdown id="preferred-country" aria-label={t('Country / region')} value={country} options={countries} searchable onValueChange={value=>{if(isCountry(value))setCountry(value);}}/></div>
          <div><label htmlFor="preferred-currency">{t('Currency')}</label><CurrencySelect id="preferred-currency" value={currency} onChange={setCurrency}/></div>
          <p>{custom?t('Preferences apply in this browser.'):t('Suggested from your language. Choose your country and currency.')}</p>
          <p>{t('Country suggests a currency; it does not change tax or lending rules.')}</p>
          {custom&&<button type="button" className={styles.resetPreferences} onClick={reset}>{t('Use language defaults')}</button>}
        </div>
      </Dialog>
    </Popover>
  </DialogTrigger>;
}
