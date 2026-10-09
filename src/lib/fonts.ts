import {Manrope} from "next/font/google";

// Match the verified heading, navigation, and body font on thebestfreepdf.com.
export const siteFont = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-site",
  weight: "variable",
});
