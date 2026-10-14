"use client";
import {useI18n} from "@/components/i18n/provider";
import Link from "@/components/i18n/link";
import {Logo} from "@/components/ui/logo";
export function Footer(){
 const {t}=useI18n();
return <footer className="site-footer" data-theme-surface="dark"><div className="container footer-top"><div><Logo/><p>{t("Clarity in every calculation.")}</p></div><nav aria-label={t("Footer navigation")}>{[[t("Time & clocks"),"/time"],[t("Spin wheels"),"/spin-wheels"],[t("Guides"),"/guides"],[t("About"),"/about"],[t("Contact"),"/contact"],[t("Privacy"),"/privacy"],[t("Terms"),"/terms"],[t("Editorial policy"),"/editorial-policy"]].map(([name,href])=><Link key={href} href={href}>{t(name)}</Link>)}</nav></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Finflo. {t("All rights reserved.")}</span><div><Link href="/accessibility">{t("Accessibility")}</Link><Link href="/sitemap">{t("Sitemap")}</Link><Link href="/disclaimer">{t("Disclaimer")}</Link><Link href="/cookies">{t("Cookies")}</Link></div><span>{t("Made for everyday decisions.")}</span></div></footer>;}
