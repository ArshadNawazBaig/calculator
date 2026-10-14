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
import {navigationLinks,secondaryNavigationLinks,isNavigationActive} from './navigation';

export function Header(){
  const pathname=splitLocale(usePathname()).path;
  const {t}=useI18n();
  return <header className={`site-header ${styles.header}`} data-theme-surface="dark">
    <div className={`container ${styles.inner}`}>
      <Logo/>
      <nav aria-label={t('Main navigation')} className={styles.desktopNav}>
        {navigationLinks.map(({label,href,icon: NavIcon})=><Link key={href} href={href} className={href==='/workspace'?styles.workspaceLink:undefined} aria-current={isNavigationActive(pathname,href)?"page":undefined}>{href==='/workspace'&&<NavIcon size={16} aria-hidden="true"/>}{t(label)}</Link>)}
      </nav>
      <div className={styles.actions}>
        <div className={styles.utilities}>
          <HeaderLanguage/>
          <ThemeSelector/>
          <HeaderSearch/>
        </div>
        <MobileNavigation key={pathname} links={navigationLinks.map(link=>({...link,label:t(link.label)}))} secondaryLinks={secondaryNavigationLinks.map(link=>({...link,label:t(link.label)}))} pathname={pathname}/>
      </div>
    </div>
  </header>;
}
