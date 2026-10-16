import Link from 'next/link';
import {Accordion, AccordionItem} from '@/components/ui/accordion';
import {getFaqContent} from '@/lib/faq';
import {localizedPath, translator, type Locale} from '@/lib/i18n/config';
import {getDictionary} from '@/lib/i18n/dictionaries';
import {breadcrumbData} from '@/lib/structured-data';
import {site} from '@/lib/site';
import {JsonLd} from './json-ld';
import {PageHero} from './page-hero';
import styles from './explanation.module.css';

export async function FaqPage({locale = 'en'}: {locale?: Locale}) {
  const [copy, messages] = await Promise.all([getFaqContent(locale), getDictionary(locale)]);
  const t = translator(messages);
  const url = site.url + localizedPath('/faq', locale);
  return <>
    <PageHero eyebrow={copy.eyebrow} title={copy.title} description={copy.description} breadcrumbs={[{label: copy.title}]}/>
    <div className="container document-page page-content" data-faq-page>
      <article className="document-body">
        <nav aria-label={copy.topicsLabel} className={styles.methodLinks}>
          {copy.groups.map(group => <a key={group.id} href={`#${group.id}`}>{group.title}</a>)}
        </nav>
        {copy.groups.map(group => <section id={group.id} key={group.id} aria-labelledby={`${group.id}-title`}>
          <h2 id={`${group.id}-title`}>{group.title}</h2>
          <p>{group.description}</p>
          <Accordion>{group.questions.map(item => <AccordionItem id={`faq-${item.id}`} key={item.id} title={item.question}>
            <p>{item.answer}</p>
            {item.link && <p><Link href={localizedPath(item.link.href, locale)}>{item.link.label}</Link></p>}
          </AccordionItem>)}</Accordion>
        </section>)}
        <section aria-labelledby="faq-contact-title">
          <h2 id="faq-contact-title">{copy.contactTitle}</h2>
          <p>{copy.contactText}</p>
          <Link className="text-link" href={localizedPath('/contact', locale)}>{copy.contactLinkLabel}</Link>
        </section>
      </article>
    </div>
    <JsonLd data={{
      '@context': 'https://schema.org', '@type': 'FAQPage', '@id': `${url}#faq`,
      url, name: copy.title, description: copy.description, inLanguage: locale,
      mainEntity: copy.groups.flatMap(group => group.questions.map(item => ({
        '@type': 'Question', '@id': `${url}#faq-${item.id}`, name: item.question,
        acceptedAnswer: {'@type': 'Answer', text: item.answer},
      }))),
    }}/>
    <JsonLd data={breadcrumbData([{name: t('Home'), path: '/'}, {name: copy.title, path: '/faq'}], locale)}/>
  </>;
}
