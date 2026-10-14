'use client';
import {themeInitScript} from '@/lib/theme';
import {useSyncExternalStore} from 'react';
import {PageHero} from '@/components/content/page-hero';
import {languages, localizedPath, splitLocale, translator} from '@/lib/i18n/config';
import messages from '@/data/locales/error-messages.json';
import {Button} from '@/components/ui/button';
import {siteFont} from "@/lib/fonts";
import './globals.css';

const subscribe = () => () => {};
const getLocale = () => splitLocale(window.location.pathname).locale;
const serverLocale = () => 'en' as const;
export default function GlobalError({retry}:{error:Error&{digest?:string};retry:()=>void}){
  const locale = useSyncExternalStore(subscribe,getLocale,serverLocale), t = translator(messages[locale]);
  return <html suppressHydrationWarning lang={locale} dir={languages[locale].direction} className={siteFont.variable}><head><title>{t('Something didn’t add up.')}</title></head><body><script id="finflo-theme-init" dangerouslySetInnerHTML={{__html:themeInitScript}}/><main id="main">
    <PageHero variant="system" showBreadcrumbs={false} eyebrow="FINFLO" title={t('Something didn’t add up.')} description={t('This page hit an unexpected problem. Try loading it again, or return to the calculator directory.')}><Button onClick={retry}>{t('Try again')}</Button><a className="button button-secondary" href={localizedPath('/calculators',locale)}>{t('Browse calculators')}</a><a className="button button-ghost" href={localizedPath('/',locale)}>{t('Go home')}</a></PageHero>
  </main></body></html>;
}
