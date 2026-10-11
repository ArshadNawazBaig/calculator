import {Noto_Sans_Devanagari} from 'next/font/google';

// Keep the Devanagari font available to Hindi without a preload on every language root.
export const hindiFont = Noto_Sans_Devanagari({subsets:['devanagari'],preload:false,display:'swap',variable:'--font-hindi',weight:'variable'});
