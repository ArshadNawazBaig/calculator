import type {Metadata} from "next";
import {Header} from "@/components/layout/header";
import {Footer} from "@/components/layout/footer";
import {site} from "@/lib/site";
import "./globals.css";
import {siteFont} from "@/lib/fonts";
import {socialImage} from "@/lib/metadata";
import {NetworkStatus} from "@/components/layout/network-status";
export const metadata:Metadata={metadataBase:new URL(site.url),title:{default:"Finflo — Free calculators for clearer decisions",template:"%s | Finflo"},description:site.description,robots:{index:site.indexable,follow:true},icons:{icon:[{url:"/favicon.ico",sizes:"any"},{url:"/favicon-32x32.png",sizes:"32x32",type:"image/png"},{url:"/favicon-16x16.png",sizes:"16x16",type:"image/png"}],apple:{url:"/apple-touch-icon.png",sizes:"180x180",type:"image/png"}},manifest:"/site.webmanifest",openGraph:{type:"website",siteName:"Finflo",locale:"en_US",title:"Finflo — Find your answer.",description:site.description,images:[socialImage]},twitter:{card:"summary_large_image",title:"Finflo",description:site.description,images:[socialImage.url]}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={siteFont.variable}><body><a className="skip-link" href="#main">Skip to content</a><Header/><NetworkStatus/><main id="main">{children}</main><Footer/></body></html>;}
