import type {ReactNode} from 'react';

export const calculatorPalettes = {
  finance: {dark: '#193c2b', medium: '#d9e4ca', accent: '#d5f915', background: '#f5f3e8'},
  health: {dark: '#294737', medium: '#e6e2d0', accent: '#d5f915', background: '#f8f2e8'},
  math: {dark: '#253e38', medium: '#dce9dc', accent: '#d5f915', background: '#f3f6ed'},
  everyday: {dark: '#373e2b', medium: '#e9e3cf', accent: '#d5f915', background: '#f7f4e9'},
};

/** Shared frame for calculator covers, social previews, and illustrated volume examples. */
export function CalculatorArtwork({palette, primary, upper, lower, description}: {
  palette: typeof calculatorPalettes.math;
  primary: ReactNode;
  upper: ReactNode;
  lower: ReactNode;
  description?: string;
}) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" aria-label={description}>
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor={palette.background}/><stop offset="1" stopColor={palette.medium}/>
      </linearGradient>
      <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor={palette.dark}/><stop offset="1" stopColor="#102c20"/>
      </linearGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="16"/><feOffset dy="14"/>
        <feComponentTransfer><feFuncA type="linear" slope=".13"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="1200" height="630" fill="url(#background)"/>
    <circle cx="1110" cy="48" r="240" fill="#fff" opacity=".23"/>
    <circle cx="595" cy="642" r="230" fill={palette.accent} opacity=".12"/>
    <path d="M530 317 C635 317 650 210 748 210 M530 317 C635 317 650 420 748 420" fill="none" stroke={palette.dark} strokeOpacity=".21" strokeWidth="3" strokeDasharray="7 12"/>
    <rect x="86" y="77" width="448" height="476" rx="48" fill="url(#panel)" filter="url(#shadow)"/>
    <circle cx="310" cy="315" r="172" fill="none" stroke="#fff" strokeOpacity=".12" strokeWidth="2"/>
    <circle cx="310" cy="315" r="145" fill="#fff" opacity=".045"/>
    {primary}
    <rect x="728" y="95" width="226" height="226" rx="44" fill="#fff" fillOpacity=".88" filter="url(#shadow)"/>
    {upper}
    <rect x="864" y="337" width="196" height="196" rx="40" fill={palette.dark} filter="url(#shadow)"/>
    {lower}
    <circle cx="668" cy="122" r="13" fill={palette.accent}/>
    <circle cx="1057" cy="210" r="21" fill={palette.accent} opacity=".72"/>
    <circle cx="683" cy="474" r="7" fill={palette.dark} opacity=".35"/>
    <circle cx="706" cy="474" r="7" fill={palette.dark} opacity=".2"/>
    <circle cx="729" cy="474" r="7" fill={palette.dark} opacity=".12"/>
  </svg>;
}
