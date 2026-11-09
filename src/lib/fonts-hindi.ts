import localFont from 'next/font/local';

// Keep the Devanagari font available to Hindi without a preload on every language root.
export const hindiFont = localFont({src:'../assets/fonts/noto-sans-devanagari-variable.woff2',preload:false,display:'swap',variable:'--font-hindi',weight:'100 900',style:'normal'});
