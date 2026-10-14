import Link from 'next/link';
import {notFound} from 'next/navigation';
import {PageHero} from '@/components/content/page-hero';
import {JsonLd} from '@/components/content/json-ld';
import {CalculatorCard} from '@/components/calculators/calculator-card';
import {WheelEditor} from '@/components/spin-wheels/wheel-editor';
import {spinWheels, wheelHref, wheelMap} from '@/lib/spin-wheels/catalog';
import {wheelGuides} from '@/lib/spin-wheels/guides';
import {wheelListings} from '@/lib/tool-listings';
import {calculatorCardData} from '@/lib/calculator-cards';
import {pageMetadata} from '@/lib/metadata';
import {breadcrumbData, guideData} from '@/lib/structured-data';
import {site} from '@/lib/site';
import styles from '@/components/spin-wheels/wheels.module.css';

export const dynamicParams = false;
export function generateStaticParams() {return spinWheels.map(wheel => ({slug: wheel.slug}));}
export async function generateMetadata({params}: {params: Promise<{slug: string}>}) {
  const wheel = wheelMap.get((await params).slug);
  return wheel ? pageMetadata(wheel.seoTitle, wheel.description, wheelHref(wheel.slug)) : {};
}

export default async function WheelPage({params}: {params: Promise<{slug: string}>}) {
  const wheel = wheelMap.get((await params).slug);
  if (!wheel) notFound();
  const guide = wheelGuides[wheel.slug];
  const path = wheelHref(wheel.slug);
  const related = wheelListings.filter(tool => tool.slug !== wheel.slug).slice(0, 4);
  return <>
    <PageHero eyebrow="SPIN WHEELS · FREE ONLINE TOOL" title={wheel.title} description={wheel.description} breadcrumbs={[{label: 'Spin wheels', href: '/spin-wheels'}, {label: wheel.title}]}/>
    <div className="container tool-page page-content">
      <WheelEditor key={wheel.slug} wheel={wheel}/>
      <div className={styles.articleLayout}>
        <article className={styles.article} aria-label={`${wheel.title} guide`}>
          <section className={styles.answer} id="about-wheel"><h2>{guide.question}</h2><p>{guide.answer}</p></section>
          <section id="how-to-use"><h2>How to use the {wheel.title.toLowerCase()}</h2><ol>{guide.steps.map(step => <li key={step}>{step}</li>)}</ol></section>
          {guide.sections.map((section, index) => <section id={`wheel-guide-${index + 1}`} key={section.title}><h2>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>)}
          <section id="how-it-works"><h2>How the random selection works</h2>
            <p>Finflo uses your browser’s random-number generator to select an entry when you press Spin the wheel. Each nonempty line has the same probability. The animation then turns the wheel so the fixed pointer lands in the center of the selected entry. Spin speed, slice color, and the position of your click do not change the selected result.</p>
            <p>The selection uses the browser’s <a href="https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues" target="_blank" rel="noreferrer">Web Crypto random values<span className="sr-only"> (opens in a new tab)</span></a> and discards values that would give some entries an extra chance. Consecutive spins can still repeat. Remove a picked entry to change the available pool before the next spin. With reduced motion enabled on your device, the result appears without the spinning animation.</p>
          </section>
          <section id="wheel-faq"><h2>{wheel.title} questions</h2>{guide.questions.map(item => <div key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></div>)}</section>
          {wheel.slug === 'number-picker-wheel' && <p>Need a larger range or several numbers at once? Open the <Link href="/random-number-generator">Random Number Generator</Link>.</p>}
          <p className={styles.byline}>Prepared by Finflo. Entries and results remain in the current page; they are not saved to your workspace. <Link href="/privacy">Privacy details</Link> · <Link href="/spin-wheels">Browse all spin wheels</Link></p>
        </article>
        <aside className={styles.related} aria-label="Related spin wheels">
          <nav className={styles.onThisPage} aria-label="On this page"><strong>On this page</strong><a href="#wheel">Use the wheel</a><a href="#about-wheel">About this wheel</a><a href="#how-to-use">How to use it</a><a href="#how-it-works">How selection works</a><a href="#wheel-faq">Common questions</a></nav>
          <h2>Try another wheel</h2><div>{related.map(tool => <CalculatorCard key={tool.slug} tool={calculatorCardData(tool)} size="compact"/>)}</div>
        </aside>
      </div>
    </div>
    <JsonLd data={{'@context': 'https://schema.org', '@type': 'WebApplication', '@id': `${site.url}${path}#wheel`, name: wheel.title, url: site.url + path, description: wheel.description, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript to spin the wheel', inLanguage: 'en', isAccessibleForFree: true, offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'}}}/>
    <JsonLd data={breadcrumbData([{name: 'Home', path: '/'}, {name: 'Spin wheels', path: '/spin-wheels'}, {name: wheel.title, path}])}/>
    <JsonLd data={guideData(guide.question, guide.answer, path)}/>
  </>;
}
