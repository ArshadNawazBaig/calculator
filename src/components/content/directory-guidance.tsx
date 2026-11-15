import {ToolChooser} from './tool-chooser';
import Link from '@/components/document-link';
import content from '@/data/directory-content.json';
import {guides} from '@/data/guides';
import {isTranslatedPage, localizedPath, translator, type Dictionary, type Locale} from '@/lib/i18n/config';

export const directoryContent = content as Record<string, {
  description: string;
  sections: {title: string; paragraphs: string[]; links: {href: string; label: string}[]}[];
  guides?: string[];
}>;

export function DirectoryGuidance({path, messages = {}, locale = 'en'}: {path: string; messages?: Dictionary; locale?: Locale}) {
  const t = translator(messages), entry = directoryContent[path];
  if (!entry) return null;
  const relatedGuides = (entry.guides || []).filter(slug => guides[slug] && (locale === 'en' || isTranslatedPage(`/guides/${slug}`)));
  const slugs = path === "/calculators" ? ["compound-interest-calculator", "bmi-calculator", "percent-calculator", "date-calculator"] : entry.sections.flatMap(section => section.links.map(link => link.href.slice(1)));
  return <article className="document-body directory-guidance">
    {entry.sections.map(section => <section key={section.title}>
      <h2>{t(section.title)}</h2>
      {section.paragraphs.map(paragraph => <p key={paragraph}>{t(paragraph)}</p>)}
      <ul>{section.links.map(link => <li key={link.href}><Link href={localizedPath(link.href, locale)}>{t(link.label)}</Link></li>)}</ul>
    </section>)}
    {!!relatedGuides.length && <section data-directory-guides>
      <h2>{t('Guides')}</h2>
      <ul>{relatedGuides.map(slug => <li key={slug}>
        <Link href={localizedPath(`/guides/${slug}`, locale)}>{t(guides[slug].title)}</Link>
        <p>{t(guides[slug].description)}</p>
      </li>)}</ul>
    </section>}
    <ToolChooser slugs={slugs} messages={messages} locale={locale}/>
  </article>;
}
