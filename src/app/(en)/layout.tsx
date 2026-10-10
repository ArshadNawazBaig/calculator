import {Header} from "@/components/layout/header";
import {Footer} from "@/components/layout/footer";
import "../globals.css";
import {siteFont} from "@/lib/fonts";
import {LanguageProvider} from "@/components/i18n/provider";
import {NetworkStatus} from "@/components/layout/network-status";
export {metadata} from "@/lib/base-metadata";
// Extensions such as Grammarly add body attributes before hydration. Descendant mismatches still warn.
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={siteFont.variable}><body suppressHydrationWarning><LanguageProvider locale="en" messages={{}}><a className="skip-link" href="#main">Skip to content</a><Header/><NetworkStatus/><main id="main">{children}</main><Footer/></LanguageProvider></body></html>;}
