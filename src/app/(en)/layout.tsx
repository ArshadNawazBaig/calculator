import {themeInitScript} from '@/lib/theme';
import {Header} from "@/components/layout/header";
import {Footer} from "@/components/layout/footer";
import "../globals.css";
import {siteFont} from "@/lib/fonts";
import {LanguageProvider} from "@/components/i18n/provider";
import {NetworkStatus} from "@/components/layout/network-status";
import {WebAnalytics} from "@/components/layout/web-analytics";
import {analyticsToken} from "@/lib/analytics";
import {site} from "@/lib/site";
export {metadata,viewport} from "@/lib/base-metadata";
// Extensions such as Grammarly add body attributes before hydration. Descendant mismatches still warn.
export default function RootLayout({children}:{children:React.ReactNode}){return <html suppressHydrationWarning lang="en" className={siteFont.variable}><head><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1970746421579261" crossOrigin="anonymous"/></head><body suppressHydrationWarning><script id="finflo-theme-init" dangerouslySetInnerHTML={{__html:themeInitScript}}/><LanguageProvider locale="en" messages={{}}><a className="skip-link" href="#main">Skip to content</a><Header/><NetworkStatus/><main id="main">{children}</main><Footer/>{analyticsToken&&<WebAnalytics token={analyticsToken} host={new URL(site.url).hostname}/>}</LanguageProvider></body></html>;}
