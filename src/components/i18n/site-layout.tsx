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
    return <html lang={locale} dir={languages[locale].direction} className={`${siteFont.variable} ${scriptFont}`}>
      {/* Extensions such as Grammarly add body attributes before hydration. Descendant mismatches still warn. */}
      <body suppressHydrationWarning><LanguageProvider locale={locale} messages={sharedMessages(messages)}>
        <a className="skip-link" href="#main">{t('Skip to content')}</a>
        <Header/><NetworkStatus/><main id="main">{children}</main><Footer/>
        {analyticsToken&&<WebAnalytics token={analyticsToken} host={new URL(site.url).hostname}/>}
      </LanguageProvider></body>
    </html>;
  };
}
