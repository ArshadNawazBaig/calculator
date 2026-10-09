import type {ReactNode} from 'react';
import {Header} from '@/components/layout/header';
import {Footer} from '@/components/layout/footer';
import {NetworkStatus} from '@/components/layout/network-status';
import {siteFont, arabicFont} from '@/lib/fonts';
import {getDictionary} from '@/lib/i18n/dictionaries';
import {languages, translator, type Locale} from '@/lib/i18n/config';
import {LanguageProvider} from './provider';
import '@/app/globals.css';

export function localizedLayout(locale: Locale) {
  return async function LocalizedLayout({children}: {children: ReactNode}) {
    const messages = await getDictionary(locale), t = translator(messages);
    return <html lang={locale} dir={languages[locale].direction} className={`${siteFont.variable} ${locale === 'ar' ? arabicFont.variable : ''}`}>
      <body><LanguageProvider locale={locale} messages={messages}>
        <a className="skip-link" href="#main">{t('Skip to content')}</a>
        <Header/><NetworkStatus/><main id="main">{children}</main><Footer/>
      </LanguageProvider></body>
    </html>;
  };
}
