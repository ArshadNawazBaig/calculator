import {translator, type Dictionary} from '@/lib/i18n/config';
export function EnglishReference({messages, path}: {messages: Dictionary; path: string}) {
  const t = translator(messages);
  return <aside className="translation-notice"><strong>{t('English reference content')}</strong><p>{t('The interface is translated. Some technical explanations, specialized fields, and policy content are currently available in English.')}</p><a href={path} hrefLang="en">{t('Read the English version')}</a></aside>;
}
