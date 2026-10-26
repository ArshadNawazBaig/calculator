import type {Metadata,Viewport} from "next";
import {site} from "./site";
import {socialImage} from "./metadata";
import {themeColors} from "./theme";
export const metadata:Metadata={metadataBase:new URL(site.url),verification:{google:process.env.GOOGLE_SITE_VERIFICATION||undefined,other:process.env.BING_SITE_VERIFICATION?{"msvalidate.01":process.env.BING_SITE_VERIFICATION}:undefined},title:"Free calculators for clearer decisions",description:site.description,robots:{index:site.indexable,follow:true},icons:{icon:[{url:"/favicon.ico",sizes:"16x16 32x32 48x48 64x64 128x128 256x256",type:"image/x-icon"},{url:"/favicon-192x192.png",sizes:"192x192",type:"image/png"},{url:"/favicon-48x48.png",sizes:"48x48",type:"image/png"},{url:"/favicon-32x32.png",sizes:"32x32",type:"image/png"},{url:"/favicon-16x16.png",sizes:"16x16",type:"image/png"}],apple:{url:"/apple-touch-icon.png",sizes:"180x180",type:"image/png"}},manifest:"/site.webmanifest",openGraph:{type:"website",siteName:"Finflo",locale:"en_US",title:"Find your answer.",description:site.description,images:[socialImage]},twitter:{card:"summary_large_image",title:"Find your answer.",description:site.description,images:[socialImage.url]}};

export const viewport:Viewport={
  themeColor:[{media:'(prefers-color-scheme: light)',color:themeColors.light},{media:'(prefers-color-scheme: dark)',color:themeColors.dark}],
  colorScheme:'light dark',
};

// Verify ownership during review without loading Auto ads on utility/error pages.
// Keep this account in sync with public/ads.txt. Serving ads is a separate integration.
metadata.other = {'google-adsense-account': 'ca-pub-1970746421579261'};
