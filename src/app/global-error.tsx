'use client';
import {themeInitScript} from '@/lib/theme';
import {SystemPage} from '@/components/content/system-page';
import {Button} from '@/components/ui/button';
import {siteFont} from "@/lib/fonts";
import './globals.css';

export default function GlobalError({retry}:{error:Error&{digest?:string};retry:()=>void}){
  return <html suppressHydrationWarning lang="en" className={siteFont.variable}><head><title>Something went wrong</title></head><body><script id="finflo-theme-init" dangerouslySetInnerHTML={{__html:themeInitScript}}/><main id="main">
    <SystemPage code="Error" title="Finflo couldn’t load this page." description="An unexpected error occurred. Your browser may be able to recover with a retry."><Button onClick={retry}>Try again</Button></SystemPage>
  </main></body></html>;
}
