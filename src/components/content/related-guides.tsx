import Link from '@/components/document-link';
import {guides, guideCalculators} from '@/data/guides';
import {isTranslatedPage, localizedPath, translator, type Dictionary, type Locale} from '@/lib/i18n/config';

export function RelatedGuides({slug, messages = {}, locale = 'en'}: {slug: string; messages?: Dictionary; locale?: Locale}) {
  const matches = Object.entries(guideCalculators).filter(([key, calculators]) => calculators.includes(slug) && (locale === 'en' || isTranslatedPage(`/guides/${key}`)));
  if (!matches.length) return null;
  const t = translator(messages);
  return <section id="related-guides">
    <h2>{t('Guides')}</h2>
    <ul>{matches.map(([key]) => <li key={key}>
      <Link href={localizedPath(`/guides/${key}`, locale)}>{t(guides[key].title)}</Link>
      <p>{t(guides[key].description)}</p>
    </li>)}</ul>
  </section>;
}
