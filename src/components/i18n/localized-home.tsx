import Link from '@/components/i18n/link';
import {SearchHero} from '@/components/content/search-hero';
import {CalculatorCard} from '@/components/calculators/calculator-card';
import {Accordion, AccordionItem} from '@/components/ui/accordion';
import {Icon} from '@/components/ui/icon';
import {BookOpen, SlidersHorizontal, UserRoundCheck, ChevronRight} from 'lucide-react';
import {categories} from '@/lib/site';
import {catalog} from '@/lib/calculators/registry';
import {calculatorCardData} from '@/lib/calculator-cards';
import {translator, type Dictionary} from '@/lib/i18n/config';
import {cardMessages} from '@/lib/i18n/dictionaries';
import {TranslationMessages} from './provider';
import {PlanningPathways, FinanceToolkit, HealthToolkit, EverydayToolkit, HowItWorks, WorkspaceIntroduction} from '@/components/home/home-details';
import {LearningGuides} from '@/components/home/learning-guides';
import styles from '@/components/home/home.module.css';

export function LocalizedHome({messages}: {messages: Dictionary}) {
  const t = translator(messages);
  const popular = ['compound-interest-calculator', 'bmi-calculator', 'percent-calculator', 'age-calculator', 'mortgage-calculator', 'loan-calculator', 'calorie-calculator', 'conversion-calculator'];
  const questions = [
    ['Can I save or share my results?', 'Inputs stay in this browser only when you choose Save calculation. Manage saved results and backups in My workspace.'],
    ['Are the calculators free to use?', 'Yes. Available calculators are free and require no account.'],
    ['Does changing language change tax rules or currency?', 'No. Language changes the interface. Check the region, currency, and units shown in each calculator.'],
    ['Do my inputs leave my device?', 'Most calculations run in your browser without an account. Road mileage sends selected locations to map services. Reference-data modes retrieve public snapshots without sending your entered amount or selected pair. The privacy policy explains local files, sharing, and optional browser-assistant tools.'],
  ];
  return <>
    <SearchHero id="home-title" eyebrow={t('A little clarity goes a long way')} title={t('Find your answer.')} highlight={t('answer.')} description={t('Free calculators for life’s big and small decisions. From your next home to your everyday numbers.')}/>
    <section className={`container ${styles.section}`} aria-labelledby="featured-title">
      <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>{t('Your everyday toolkit')}</span><h2 id="featured-title">{t('Start with a calculator.')}</h2></div><Link className={styles.sectionLink} href="/calculators">{t('All calculators')}<ChevronRight size={16}/></Link></div>
      <TranslationMessages messages={cardMessages(messages,popular.map(slug=>({slug})))}><div className="directory-grid">{popular.map(slug => <CalculatorCard key={slug} tool={calculatorCardData(catalog.find(tool => tool.slug === slug)!)}/>)}</div></TranslationMessages>
    </section>
    <section className={`container ${styles.section}`} aria-labelledby="categories-title">
      <div className={styles.sectionHeading}><h2 id="categories-title">{t('Browse by category')}</h2></div>
      <div className={styles.categoryGrid}>{categories.map(category => <article className={styles.category} data-category={category.id} key={category.id}>
        <span className={styles.categoryIcon}><Icon name={category.icon} size={25}/></span><h3><Link href={`/calculators/${category.id}`}>{t(category.name)}</Link></h3><p>{t(category.description)}</p>
        <ul>{category.links.map(link => <li key={link.slug}><Link href={`/${link.slug}`}>{t(`tool.${link.slug}`)}</Link></li>)}</ul>
        <Link className={styles.categoryAll} href={`/calculators/${category.id}`}>{t('All calculators')}<ChevronRight size={15}/></Link>
      </article>)}</div>
    </section>
    <PlanningPathways messages={messages}/>
    <FinanceToolkit messages={messages}/>
    <HealthToolkit messages={messages}/>
    <EverydayToolkit messages={messages}/>
    <HowItWorks messages={messages}/>
    <section className={styles.confidence} aria-labelledby="confidence-title"><div className={`container ${styles.confidenceInner}`}>
      <div className={styles.confidenceIntro}><span className={styles.eyebrow}>{t('Clarity comes from context')}</span><h2 id="confidence-title">{t('Understand the number.')}</h2><p>{t('Check units and assumptions before using a result.')}</p></div>
      <div className={styles.benefits}>{[
        {icon: BookOpen, title: 'Formulas explained', text: 'Check units and assumptions before using a result.'},
        {icon: SlidersHorizontal, title: 'Your everyday toolkit', text: 'Change a rate, a date, or an amount to explore different scenarios.'},
        {icon: UserRoundCheck, title: 'No account needed', text: 'Most calculations run in your browser. Sharing a tool link does not include your inputs.'},
      ].map(({icon: BenefitIcon, title, text}) => <div className={styles.benefit} key={title}><BenefitIcon size={23}/><div><h3>{t(title)}</h3><p>{t(text)}</p></div></div>)}</div>
    </div></section>
    <WorkspaceIntroduction messages={messages}/>
    <LearningGuides messages={messages}/>
    <section className={`container ${styles.section} ${styles.faq}`} aria-labelledby="faq-title"><div className={styles.faqIntro}><h2 id="faq-title">{t('Good to know.')}</h2></div><Accordion>{questions.map(([question, answer]) => <AccordionItem key={question} title={t(question)}><p>{t(answer)}</p></AccordionItem>)}</Accordion></section>
    <section className={`container ${styles.closing}`} aria-labelledby="closing-title"><h2 id="closing-title">{t('Your next answer is a calculation away.')}</h2><Link className="button button-primary" href="/calculators">{t('Browse all calculators')}<ChevronRight size={17}/></Link></section>
  </>;
}
