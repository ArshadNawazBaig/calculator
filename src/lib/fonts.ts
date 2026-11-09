import localFont from "next/font/local";

// Bundle the existing font so preview and production builds work offline.
export const siteFont = localFont({
  src: "../assets/fonts/manrope-variable.woff2",
  display: "swap",
  variable: "--font-site",
  weight: "200 800",
  style: "normal",
});
