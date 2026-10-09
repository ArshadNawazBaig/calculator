import {Inter} from "next/font/google";

// Self-host the shared UI font; Inter is the provisional match for the Folio reference.
export const siteFont = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-site",
  weight: "variable",
});
