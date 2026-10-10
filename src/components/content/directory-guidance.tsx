import Link from 'next/link';
import content from '@/data/directory-content.json';
import {localizedPath, translator, type Dictionary, type Locale} from '@/lib/i18n/config';

export const directoryContent = content as Record<string, {
  description: string;
  sections: {title: string; paragraphs: string[]; links: {href: string; label: string}[]}[];
}>;

export function DirectoryGuidance({path, messages = {}, locale = 'en'}: {path: string; messages?: Dictionary; locale?: Locale}) {
  const t = translator(messages), entry = directoryContent[path];
  if (!entry) return null;
  return <article className="document-body directory-guidance">
    {entry.sections.map(section => <section key={section.title}>
      <h2>{t(section.title)}</h2>
      {section.paragraphs.map(paragraph => <p key={paragraph}>{t(paragraph)}</p>)}
      <ul>{section.links.map(link => <li key={link.href}><Link href={localizedPath(link.href, locale)}>{t(link.label)}</Link></li>)}</ul>
    </section>)}
  </article>;
}
