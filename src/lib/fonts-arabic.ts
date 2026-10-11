import {Noto_Sans_Arabic} from 'next/font/google';

// The production bundler combines font preload lists across language roots.
// Load this font through CSS when Arabic is used instead of preloading it on English pages.
export const arabicFont = Noto_Sans_Arabic({subsets:['arabic'],preload:false,display:'swap',variable:'--font-arabic',weight:'variable'});
