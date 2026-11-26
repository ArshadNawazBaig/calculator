import localFont from "next/font/local";

const latin = localFont({
  src: "../assets/fonts/manrope-latin.woff2",
  display: "swap",
  variable: "--font-site",
  weight: "200 800",
  style: "normal",
  adjustFontFallback: false,
});

// Keep the original Greek, Cyrillic and extended glyphs available on demand.
// Its metric-adjusted fallback also covers the initial Latin text while the subset loads.
const extended = localFont({
  src: "../assets/fonts/manrope-variable.woff2",
  display: "swap",
  variable: "--font-site-extended",
  weight: "200 800",
  style: "normal",
  preload: false,
  declarations: [{prop: "unicode-range", value: "U+0100-0130,U+0134-0151,U+0154-0259,U+02C7,U+02D8-02D9,U+02DB,U+02DD,U+0370-052F,U+1E80-1E85,U+1EA0-1EF9,U+E001-E009"}],
});

export const siteFont = {variable: `${latin.variable} ${extended.variable}`};
