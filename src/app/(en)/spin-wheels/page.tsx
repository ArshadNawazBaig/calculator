import Link from 'next/link';
import {Check, ListChecks, UserRoundCheck} from 'lucide-react';
import {PageHero} from '@/components/content/page-hero';
import {JsonLd} from '@/components/content/json-ld';
import {CalculatorCard} from '@/components/calculators/calculator-card';
import {calculatorCardData} from '@/lib/calculator-cards';
import {wheelListings} from '@/lib/tool-listings';
import {spinWheels, wheelHref} from '@/lib/spin-wheels/catalog';
import {pageMetadata} from '@/lib/metadata';
import {breadcrumbData} from '@/lib/structured-data';
import {site} from '@/lib/site';
import styles from '@/components/spin-wheels/wheels.module.css';

const description = 'Explore free spin wheels for names, yes/no decisions, numbers, food, colors, and games. Customize your entries and let a random picker choose.';
export const metadata = pageMetadata('Spin Wheels – Free Random Pickers & Wheel Spinners | Finflo', description, '/spin-wheels');

export default function SpinWheelsPage() {
  return <>
    <PageHero eyebrow="A LITTLE CHANCE. A NEW CHOICE." title="Spin wheels & random pickers" highlight="random pickers" description={description} breadcrumbs={[{label: 'Spin wheels'}]}/>
    <div className="container directory-page page-content">
      <div className={styles.facts}><span><Check size={16} aria-hidden="true"/>Free to use</span><span><UserRoundCheck size={16} aria-hidden="true"/>No account needed</span><span><ListChecks size={16} aria-hidden="true"/>Your entries, your choices</span></div>
      <section aria-labelledby="wheel-library-title">
        <div className={styles.intro}><div><h2 id="wheel-library-title">Find your next wheel.</h2><p>Start with a ready-made list, then make it yours. Every wheel uses the same simple editor and clear results.</p></div><span className={styles.count}>{spinWheels.length} wheels to explore</span></div>
        <div className="directory-grid">{wheelListings.map(tool => <CalculatorCard key={tool.slug} tool={calculatorCardData(tool)}/>)}</div>
      </section>
      <article className={`${styles.article} ${styles.directoryArticle}`} aria-label="Guide to spin wheels">
        <section id="what-is-a-picker-wheel"><h2>What is a picker wheel?</h2><p>A picker wheel is a visual random selector. Each entry in your list becomes a slice, and a spin chooses one entry. Use a wheel of names to choose a participant, a yes or no wheel for a quick binary choice, or a custom wheel for a shortlist of your own ideas. Every nonempty line has an equal chance.</p><p>The wheel is useful when you have already decided that any of the listed options is acceptable. It does not compare the quality of your choices or recommend the best one. Build a practical list first, then let the random selection provide a starting point.</p></section>
        <section id="choose-a-wheel"><h2>Which spin wheel should I use?</h2><ul>
          <li><Link href={wheelHref('spin-the-wheel')}>Spin the Wheel</Link> is the general wheel maker for tasks, topics, plans, and other custom choices.</li>
          <li><Link href={wheelHref('wheel-of-names')}>Wheel of Names</Link> is a name picker for classroom participation, games, and turn-taking. Remove selected entries to work through a group.</li>
          <li><Link href={wheelHref('yes-or-no-wheel')}>Yes or No Wheel</Link> starts with two equal choices. Add Maybe when a third answer suits the question.</li>
          <li><Link href={wheelHref('number-picker-wheel')}>Number Picker Wheel</Link> provides 1–10, 1–20, 1–50, and 1–100 presets, plus an editable integer range.</li>
          <li><Link href={wheelHref('what-to-eat-wheel')}>What to Eat Wheel</Link> helps choose from meals, cuisines, or your own restaurant shortlist.</li>
          <li><Link href={wheelHref('random-color-wheel')}>Random Color Wheel</Link> picks a color for an art prompt and shows hex codes for supported color names.</li>
          <li><Link href={wheelHref('truth-or-dare-wheel')}>Truth or Dare Wheel</Link> includes lighthearted questions and playful challenges that you can edit for your group.</li>
          <li><Link href={wheelHref('activity-wheel')}>Activity Wheel</Link> offers indoor, outdoor, and creative ideas for your next break.</li>
        </ul></section>
        <section id="make-a-wheel"><h2>How to make your own spinning wheel</h2><ol><li>Open the wheel closest to your goal. Its starting list gives you examples, but you can replace every entry.</li><li>Type or paste one choice per line. Blank lines are ignored. Each wheel accepts up to 100 entries, with up to 60 characters per entry.</li><li>Check the list and select Spin the wheel. The full result appears below the spinner, even when a slice label is shortened.</li><li>Copy the result, spin again, or remove the selected entry. Reset wheel restores the original list and clears the recent results.</li></ol></section>
        <section id="random-wheel-odds"><h2>Equal chances, duplicates, and repeat results</h2><p>Each line has the same chance of being picked. With eight different entries, that is one chance in eight per entry. A duplicate label on two lines has two chances, so review repeated entries if you want equal odds for distinct choices. Shuffle changes where the slices appear, without changing their probabilities.</p><p>Spins are independent while the list stays the same, which means the same result can appear twice. To pick without repeats, remove the selected entry after each spin. With more than 40 entries, labels are hidden on the small slices; the list and result remain readable. Device settings for reduced motion are also respected.</p></section>
        <section id="wheel-library-faq"><h2>Questions about spin wheels</h2><h3>Do I need an account or an app?</h3><p>No. The wheels run in your browser without an account. JavaScript is needed for editing and spinning. The guides and explanations are available as ordinary page text.</p><h3>Where do my entries and results go?</h3><p>The wheel keeps them in the current page. They are not uploaded by the wheel or saved to your workspace. Reloading or leaving clears the list and recent spins, so copy anything you want to keep.</p><h3>Can I share a wheel with my custom list?</h3><p>You can share the page address to open the same wheel type, but it does not include your edited entries. Copy result copies only the picked text and, for supported colors, its hex code.</p><h3>Does a wheel help with an important decision?</h3><p>A wheel chooses randomly and cannot evaluate consequences. Use it for choices where the available outcomes are already acceptable. For a decision that needs numbers or comparison, explore Finflo’s <Link href="/calculators">calculator library</Link> instead.</p></section>
      </article>
    </div>
    <JsonLd data={{'@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${site.url}/spin-wheels#collection`, name: 'Spin wheels & random pickers', description, url: `${site.url}/spin-wheels`, inLanguage: 'en', mainEntity: {'@type': 'ItemList', itemListElement: spinWheels.map((wheel, index) => ({'@type': 'ListItem', position: index + 1, name: wheel.title, url: site.url + wheelHref(wheel.slug)}))}}}/>
    <JsonLd data={breadcrumbData([{name: 'Home', path: '/'}, {name: 'Spin wheels', path: '/spin-wheels'}])}/>
  </>;
}
