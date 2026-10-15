import {NotFoundContent} from '@/components/content/not-found-content';
import {featuredTools} from '@/lib/home-content';
import {cardMessages, getDictionary} from '@/lib/i18n/dictionaries';
import type {Locale} from '@/lib/i18n/config';
import {TranslationMessages} from './provider';

export function localizedNotFound(locale: Locale) {
  return async function LocalizedNotFound() {
    const messages = await getDictionary(locale);
    return <TranslationMessages messages={cardMessages(messages, featuredTools.all)}>
      <NotFoundContent/>
    </TranslationMessages>;
  };
}
