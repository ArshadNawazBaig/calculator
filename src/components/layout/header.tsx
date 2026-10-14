"use client";
import {usePathname} from "next/navigation";
import Link from "@/components/i18n/link";
import {Logo} from "@/components/ui/logo";
import {HeaderLanguage} from "./header-language";
import {HeaderSearch} from "./header-search";
import {ThemeSelector} from "./theme-selector";
import {MobileNavigation} from "./mobile-navigation";
import styles from "./header.module.css";
import {useI18n} from '@/components/i18n/provider';
import {splitLocale} from '@/lib/i18n/config';

const navigationLinks=[
  {label:"All calculators",href:"/calculators"},
  {label:"Finance",href:"/calculators/finance"},
  {label:"Health",href:"/calculators/health"},
  {label:"Math",href:"/calculators/math"},
  {label:"Everyday",href:"/calculators/everyday"},
  {label:"Guides",href:"/guides"},
  {label:"My workspace",href:"/workspace"},
];

export function Header(){
  const pathname=splitLocale(usePathname()).path;
  const {t}=useI18n();
  return <header className={`site-header ${styles.header}`} data-theme-surface="dark">
    <div className={`container ${styles.inner}`}>
      <Logo/>
      <nav aria-label={t('Main navigation')} className={styles.desktopNav}>
        {navigationLinks.map(({label,href})=><Link key={href} href={href} aria-current={(pathname===href||(href!=="/calculators"&&pathname.startsWith(`${href}/`)))?"page":undefined}>{t(label)}</Link>)}
      </nav>
      <div className={styles.actions}>
        <HeaderLanguage/>
        <ThemeSelector/>
        <HeaderSearch/>
        <MobileNavigation key={pathname} links={[...navigationLinks,{label:"About Finflo",href:"/about"}].map(link=>({...link,label:t(link.label)}))} pathname={pathname}/>
      </div>
    </div>
  </header>;
}
