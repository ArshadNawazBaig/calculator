import {Fragment} from 'react';
import {WheelOdds} from './wheel-odds';
import Link from '@/components/i18n/link';
import {TranslationMessages} from '@/components/i18n/provider';
import {translator, localizedPath, type Dictionary, type Locale} from '@/lib/i18n/config';
import {cardMessages} from '@/lib/i18n/dictionaries';
import {Check, ListChecks, UserRoundCheck} from 'lucide-react';
import {PageHero} from '@/components/content/page-hero';
import {JsonLd} from '@/components/content/json-ld';
import {CalculatorCard} from '@/components/calculators/calculator-card';
import {calculatorCardData} from '@/lib/calculator-cards';
import {wheelListings} from '@/lib/tool-listings';
import {spinWheels, wheelHref} from '@/lib/spin-wheels/catalog';
import {breadcrumbData} from '@/lib/structured-data';
import {site} from '@/lib/site';
import styles from '@/components/spin-wheels/wheels.module.css';

export const wheelLibraryDescription = 'Explore free spin wheels for names, yes/no decisions, numbers, food, colors, and games. Customize your entries and let a random picker choose.';
export const wheelLibraryTitle = 'Spin Wheels – Free Random Pickers & Wheel Spinners | Finflo';

function LinkedSentence({sentence, placeholder, href, label}: {sentence: string; placeholder: 'wheelLink' | 'calculatorLink'; href: string; label: string}) {
  return sentence.split(`{${placeholder}}`).map((part, index) => <Fragment key={index}>{index > 0 && <Link href={href}>{label}</Link>}{part}</Fragment>);
}

export function SpinWheelsPage({locale = 'en', messages = {}}: {locale?: Locale; messages?: Dictionary}) {
  const t = translator(messages), description = t(wheelLibraryDescription);
  return <TranslationMessages messages={cardMessages(messages,wheelListings)}>
    <PageHero eyebrow={t("A LITTLE CHANCE. A NEW CHOICE.")} title={t("Spin wheels & random pickers")} highlight={t("random pickers")} description={description} breadcrumbs={[{label: t('Spin wheels')}]}/>
    <div className="container directory-page page-content">
      <div className={styles.facts}><span><Check size={16} aria-hidden="true"/>{t("Free to use")}</span><span><UserRoundCheck size={16} aria-hidden="true"/>{t("No account needed")}</span><span><ListChecks size={16} aria-hidden="true"/>{t("Your entries, your choices")}</span></div>
      <section aria-labelledby="wheel-library-title">
        <div className={styles.intro}><div><h2 id="wheel-library-title">{t("Find your next wheel.")}</h2><p>{t("Start with a ready-made list, then make it yours. Every wheel uses the same simple editor and clear results.")}</p></div><span className={styles.count}>{t("{count} wheels to explore", {count: spinWheels.length})}</span></div>
        <div className="directory-grid">{wheelListings.map(tool => <CalculatorCard key={tool.slug} tool={calculatorCardData(tool)} appearance="directory"/>)}</div>
      </section>
      <article className={`${styles.article} ${styles.directoryArticle}`} aria-label={t("Guide to spin wheels")}>
        <section id="what-is-a-picker-wheel"><h2>{t("What is a picker wheel?")}</h2><p>{t("A picker wheel is a visual random selector. Each entry in your list becomes a slice, and a spin chooses one entry. Use a wheel of names to choose a participant, a yes or no wheel for a quick binary choice, or a custom wheel for a shortlist of your own ideas. Every nonempty line has an equal chance.")}</p><p>{t("The wheel is useful when you have already decided that any of the listed options is acceptable. It does not compare the quality of your choices or recommend the best one. Build a practical list first, then let the random selection provide a starting point.")}</p></section>
        <section id="choose-a-wheel"><h2>{t("Which spin wheel should I use?")}</h2><ul>
          <li><LinkedSentence sentence={t("{wheelLink} is the general wheel maker for tasks, topics, plans, and other custom choices.")} placeholder="wheelLink" href={wheelHref('spin-the-wheel')} label={t("Spin the Wheel")}/></li>
          <li><LinkedSentence sentence={t("{wheelLink} is a name picker for classroom participation, games, and turn-taking. Remove selected entries to work through a group.")} placeholder="wheelLink" href={wheelHref('wheel-of-names')} label={t("Wheel of Names")}/></li>
          <li><LinkedSentence sentence={t("{wheelLink} starts with two equal choices. Add Maybe when a third answer suits the question.")} placeholder="wheelLink" href={wheelHref('yes-or-no-wheel')} label={t("Yes or No Wheel")}/></li>
          <li><LinkedSentence sentence={t("{wheelLink} provides 1–10, 1–20, 1–50, and 1–100 presets, plus an editable integer range.")} placeholder="wheelLink" href={wheelHref('number-picker-wheel')} label={t("Number Picker Wheel")}/></li>
          <li><LinkedSentence sentence={t("{wheelLink} helps choose from meals, cuisines, or your own restaurant shortlist.")} placeholder="wheelLink" href={wheelHref('what-to-eat-wheel')} label={t("What to Eat Wheel")}/></li>
          <li><LinkedSentence sentence={t("{wheelLink} picks a color for an art prompt and shows hex codes for supported color names.")} placeholder="wheelLink" href={wheelHref('random-color-wheel')} label={t("Random Color Wheel")}/></li>
          <li><LinkedSentence sentence={t("{wheelLink} includes lighthearted questions and playful challenges that you can edit for your group.")} placeholder="wheelLink" href={wheelHref('truth-or-dare-wheel')} label={t("Truth or Dare Wheel")}/></li>
          <li><LinkedSentence sentence={t("{wheelLink} offers indoor, outdoor, and creative ideas for your next break.")} placeholder="wheelLink" href={wheelHref('activity-wheel')} label={t("Activity Wheel")}/></li>
        </ul></section>
        <section id="make-a-wheel"><h2>{t("How to make your own spinning wheel")}</h2><ol><li>{t("Open the wheel closest to your goal. Its starting list gives you examples, but you can replace every entry.")}</li><li>{t("Type or paste one choice per line. Blank lines are ignored. Each wheel accepts up to 100 entries, with up to 60 characters per entry.")}</li><li>{t("Check the list and select Spin the wheel. The full result appears below the spinner, even when a slice label is shortened.")}</li><li>{t("Copy the result, spin again, or remove the selected entry. Reset wheel restores the original list and clears the recent results.")}</li></ol></section>
        <WheelOdds entries={['A','A','B']} locale={locale} example/>
        <section id="random-wheel-odds"><h2>{t("Equal chances, duplicates, and repeat results")}</h2><p>{t("Each line has the same chance of being picked. With eight different entries, that is one chance in eight per entry. A duplicate label on two lines has two chances, so review repeated entries if you want equal odds for distinct choices. Shuffle changes where the slices appear, without changing their probabilities.")}</p><p>{t("Spins are independent while the list stays the same, which means the same result can appear twice. To pick without repeats, remove the selected entry after each spin. With more than 40 entries, labels are hidden on the small slices; the list and result remain readable. Device settings for reduced motion are also respected.")}</p></section>
        <section id="wheel-library-faq"><h2>{t("Questions about spin wheels")}</h2><h3>{t("Do I need an account or an app?")}</h3><p>{t("No. The wheels run in your browser without an account. JavaScript is needed for editing and spinning. The guides and explanations are available as ordinary page text.")}</p><h3>{t("Where do my entries and results go?")}</h3><p>{t("The wheel keeps them in the current page. They are not uploaded by the wheel or saved to your workspace. Reloading or leaving clears the list and recent spins, so copy anything you want to keep.")}</p><h3>{t("Can I share a wheel with my custom list?")}</h3><p>{t("You can share the page address to open the same wheel type, but it does not include your edited entries. Copy result copies only the picked text and, for supported colors, its hex code.")}</p><h3>{t("Does a wheel help with an important decision?")}</h3><p><LinkedSentence sentence={t("A wheel chooses randomly and cannot evaluate consequences. Use it for choices where the available outcomes are already acceptable. For a decision that needs numbers or comparison, explore Finflo’s {calculatorLink} instead.")} placeholder="calculatorLink" href="/calculators" label={t("calculator library")}/></p></section>
      </article>
    </div>
    <JsonLd data={{'@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${site.url}${localizedPath("/spin-wheels",locale)}#collection`, name: t('Spin wheels & random pickers'), description, url: site.url + localizedPath("/spin-wheels",locale), inLanguage: locale, mainEntity: {'@type': 'ItemList', itemListElement: spinWheels.map((wheel, index) => ({'@type': 'ListItem', position: index + 1, name: t(wheel.title), url: site.url + localizedPath(wheelHref(wheel.slug),locale)}))}}}/>
    <JsonLd data={breadcrumbData([{name: t('Home'), path: '/'}, {name: t('Spin wheels'), path: '/spin-wheels'}],locale)}/>
  </TranslationMessages>;
}
