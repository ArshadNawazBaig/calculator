"use client";
import {usePathname} from "next/navigation";
import Link from "next/link";
import {Logo} from "@/components/ui/logo";
import {HeaderLanguage} from "./header-language";
import {HeaderSearch} from "./header-search";
import {MobileNavigation} from "./mobile-navigation";
import styles from "./header.module.css";

const navigationLinks=[
  {label:"All calculators",href:"/calculators"},
  {label:"Finance",href:"/calculators/finance"},
  {label:"Health",href:"/calculators/health"},
  {label:"Math",href:"/calculators/math"},
  {label:"Everyday",href:"/calculators/everyday"},
  {label:"Guides",href:"/guides"},
];

export function Header(){
  const pathname=usePathname();
  return <header className={`site-header ${styles.header}`}>
    <div className={`container ${styles.inner}`}>
      <Logo onDark/>
      <nav aria-label="Main navigation" className={styles.desktopNav}>
        {navigationLinks.map(({label,href})=><Link key={href} href={href} aria-current={(pathname===href||(href!=="/calculators"&&pathname.startsWith(`${href}/`)))?"page":undefined}>{label}</Link>)}
      </nav>
      <div className={styles.actions}>
        <HeaderLanguage/>
        <HeaderSearch/>
        <MobileNavigation key={pathname} links={[...navigationLinks,{label:"About Finflo",href:"/about"}]} pathname={pathname}/>
      </div>
    </div>
  </header>;
}
