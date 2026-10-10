import {Manrope,Noto_Sans_Arabic,Noto_Sans_Devanagari} from "next/font/google";

// Match the verified heading, navigation, and body font on thebestfreepdf.com.
export const siteFont = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-site",
  weight: "variable",
});

export const arabicFont = Noto_Sans_Arabic({subsets:["arabic"],display:"swap",variable:"--font-arabic",weight:"variable"});
export const hindiFont = Noto_Sans_Devanagari({subsets:["devanagari"],display:"swap",variable:"--font-hindi",weight:"variable"});
