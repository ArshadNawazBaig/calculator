import content from '@/data/calculator-content.json';
import {translator, type Dictionary} from '@/lib/i18n/config';

/** Server-rendered topic guidance, shared by English and translated articles. */
export function CalculatorGuidance({slug, messages = {}}: {slug: string; messages?: Dictionary}) {
  const t = translator(messages);
  const entry = (content as Record<string, {sections: {title: string; paragraphs: string[]}[]}>)[slug];
  return entry?.sections.map((section, index) => <section key={section.title} id={`understanding-${index + 1}`}>
    <h2>{t(section.title)}</h2>
    {section.paragraphs.map(paragraph => <p key={paragraph}>{t(paragraph)}</p>)}
  </section>);
}
