import {WheelOdds} from './wheel-odds';
import Link from '@/components/i18n/link';
import {TranslationMessages} from '@/components/i18n/provider';
import {translator, localizedPath, type Dictionary, type Locale} from '@/lib/i18n/config';
import {localizeWheel} from '@/lib/spin-wheels/localize';
import {wheelMessages} from '@/lib/i18n/content';
import {notFound} from 'next/navigation';
import {PageHero} from '@/components/content/page-hero';
import {JsonLd} from '@/components/content/json-ld';
import {CalculatorCard} from '@/components/calculators/calculator-card';
import {WheelEditor} from '@/components/spin-wheels/wheel-editor';
import {wheelHref, wheelMap} from '@/lib/spin-wheels/catalog';
import {wheelGuides} from '@/lib/spin-wheels/guides';
import {wheelListings} from '@/lib/tool-listings';
import {calculatorCardData} from '@/lib/calculator-cards';
import {breadcrumbData, guideData} from '@/lib/structured-data';
import {site} from '@/lib/site';
import styles from '@/components/spin-wheels/wheels.module.css';

export function WheelPage({slug, locale = 'en', messages = {}}: {slug: string; locale?: Locale; messages?: Dictionary}) {
  const source = wheelMap.get(slug);
  if (!source) notFound();
  const t = translator(messages), wheel = localizeWheel(source, messages);
  const guide = wheelGuides[wheel.slug];
  const path = wheelHref(wheel.slug);
  const related = wheelListings.filter(tool => tool.slug !== wheel.slug).slice(0, 4);
  return <TranslationMessages messages={wheelMessages(messages,related)}>
    <PageHero eyebrow={t("SPIN WHEELS · FREE ONLINE TOOL")} title={wheel.title} description={wheel.description} breadcrumbs={[{label: t('Spin wheels'), href: '/spin-wheels'}, {label: wheel.title}]}/>
    <div className="container tool-page page-content">
      <WheelEditor key={`${locale}-${wheel.slug}`} wheel={wheel}/>
      <div className={styles.articleLayout}>
        <article className={styles.article} aria-label={t("{wheel} guide", {wheel: wheel.title})}>
          <section className={styles.answer} id="about-wheel"><h2>{t(guide.question)}</h2><p>{t(guide.answer)}</p></section>
          <section id="how-to-use"><h2>{t("How to use {wheel}", {wheel: wheel.title})}</h2><ol>{guide.steps.map(step => <li key={step}>{t(step)}</li>)}</ol></section>
          {guide.sections.map((section, index) => <section id={`wheel-guide-${index + 1}`} key={t(section.title)}><h2>{t(section.title)}</h2>{section.paragraphs.map(paragraph => <p key={t(paragraph)}>{t(paragraph)}</p>)}</section>)}
          <WheelOdds entries={wheel.entries} locale={locale}/>
          <section id="how-it-works"><h2>{t("How the random selection works")}</h2>
            <p>{t("Finflo uses your browser’s random-number generator to select an entry when you press Spin the wheel. Each nonempty line has the same probability. The animation then turns the wheel so the fixed pointer lands in the center of the selected entry. Spin speed, slice color, and the position of your click do not change the selected result.")}</p>
            <p>{t("The selection uses the browser’s")}{" "}<a href="https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues" target="_blank" rel="noreferrer">{t("Web Crypto random values")}<span className="sr-only">{" "}{t("(opens in a new tab)")}</span></a>{" "}{t("and discards values that would give some entries an extra chance. Consecutive spins can still repeat. Remove a picked entry to change the available pool before the next spin. With reduced motion enabled on your device, the result appears without the spinning animation.")}</p>
          </section>
          <section id="wheel-faq"><h2>{t("{wheel}: common questions", {wheel: wheel.title})}</h2>{guide.questions.map(item => <div key={t(item.question)}><h3>{t(item.question)}</h3><p>{t(item.answer)}</p></div>)}</section>
          {wheel.slug === 'number-picker-wheel' && <p>{t("Need a larger range or several numbers at once? Open the")}{" "}<Link href="/random-number-generator">{t("Random Number Generator")}</Link>.</p>}
          <p className={styles.byline}>{t("Prepared by Finflo. Entries and results remain in the current page; they are not saved to your workspace.")}{" "}<Link href="/privacy">{t("Privacy details")}</Link> · <Link href="/spin-wheels">{t("Browse all spin wheels")}</Link></p>
        </article>
        <aside className={styles.related} aria-label={t("Related spin wheels")}>
          <nav className={styles.onThisPage} aria-label={t("On this page")}><strong>{t("On this page")}</strong><a href="#wheel">{t("Use the wheel")}</a><a href="#about-wheel">{t("About this wheel")}</a><a href="#how-to-use">{t("How to use it")}</a><a href="#how-it-works">{t("How selection works")}</a><a href="#wheel-faq">{t("Common questions")}</a></nav>
          <h2>{t("Try another wheel")}</h2><div>{related.map(tool => <CalculatorCard key={tool.slug} tool={calculatorCardData(tool)} size="compact"/>)}</div>
        </aside>
      </div>
    </div>
    <JsonLd data={{'@context': 'https://schema.org', '@type': 'WebApplication', '@id': `${site.url}${localizedPath(path, locale)}#wheel`, name: wheel.title, url: site.url + localizedPath(path, locale), description: wheel.description, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', browserRequirements: t('Requires JavaScript to spin the wheel'), inLanguage: locale, isAccessibleForFree: true, offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'}}}/>
    <JsonLd data={breadcrumbData([{name: t('Home'), path: '/'}, {name: t('Spin wheels'), path: '/spin-wheels'}, {name: wheel.title, path}], locale)}/>
    <JsonLd data={guideData(t(guide.question), t(guide.answer), path, locale)}/>
  </TranslationMessages>;
}
