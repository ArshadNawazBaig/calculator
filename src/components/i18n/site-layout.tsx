import {themeInitScript} from '@/lib/theme';
import type {ReactNode} from 'react';
import {Header} from '@/components/layout/header';
import {Footer} from '@/components/layout/footer';
import {NetworkStatus} from '@/components/layout/network-status';
import {WebAnalytics} from '@/components/layout/web-analytics';
import {analyticsToken} from '@/lib/analytics';
import {site} from '@/lib/site';
import {siteFont} from '@/lib/fonts';
import {getDictionary, sharedMessages} from '@/lib/i18n/dictionaries';
import {languages, translator, type Locale} from '@/lib/i18n/config';
import {LanguageProvider} from './provider';
import '@/app/globals.css';

export function localizedLayout(locale: Locale, scriptFont = '') {
  return async function LocalizedLayout({children}: {children: ReactNode}) {
    const messages = await getDictionary(locale), t = translator(messages);
    return <html suppressHydrationWarning lang={locale} dir={languages[locale].direction} className={`${siteFont.variable} ${scriptFont}`}>
      {/* eslint-disable-next-line @next/next/no-head-element -- This shared component renders App Router root layouts. */}
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1970746421579261"
          crossOrigin="anonymous"
        />
      </head>
      {/* Extensions such as Grammarly add body attributes before hydration. Descendant mismatches still warn. */}
      <body suppressHydrationWarning><script id="finflo-theme-init" dangerouslySetInnerHTML={{__html:themeInitScript}}/><LanguageProvider locale={locale} messages={sharedMessages(messages)}>
        <a className="skip-link" href="#main">{t('Skip to content')}</a>
        <Header/><NetworkStatus/><main id="main">{children}</main><Footer/>
        {analyticsToken&&<WebAnalytics token={analyticsToken} host={new URL(site.url).hostname}/>}
      </LanguageProvider></body>
    </html>;
  };
}
