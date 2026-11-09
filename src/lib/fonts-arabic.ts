import localFont from 'next/font/local';

// The production bundler combines font preload lists across language roots.
// Load this font through CSS when Arabic is used instead of preloading it on English pages.
export const arabicFont = localFont({src:'../assets/fonts/noto-sans-arabic-variable.woff2',preload:false,display:'swap',variable:'--font-arabic',weight:'100 900',style:'normal'});
