import type {Metadata} from "next";
import {Header} from "@/components/layout/header";
import {Footer} from "@/components/layout/footer";
import {site} from "@/lib/site";
import "./globals.css";
import {socialImage} from "@/lib/metadata";
import {NetworkStatus} from "@/components/layout/network-status";
export const metadata:Metadata={metadataBase:new URL(site.url),title:{default:"Finflo — Free calculators for clearer decisions",template:"%s | Finflo"},description:site.description,robots:{index:site.indexable,follow:true},icons:{icon:"/favicon.svg",apple:"/apple-touch-icon.png"},openGraph:{type:"website",siteName:"Finflo",locale:"en_US",title:"Finflo — clarity in every calculation",description:site.description,images:[socialImage]},twitter:{card:"summary_large_image",title:"Finflo",description:site.description,images:[socialImage.url]}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Header/><NetworkStatus/><main id="main">{children}</main><Footer/></body></html>;}
