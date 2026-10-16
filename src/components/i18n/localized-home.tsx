import {PercentageDemo} from '@/components/home/percentage-demo';
import {TimeCollection} from '@/components/time/time-collection';
import {timeTools} from '@/lib/time/tools';
import Link from '@/components/i18n/link';
import {HomeExplorer} from '@/components/home/home-explorer';
import {featuredTools} from '@/lib/home-content';
import {homeMessages} from '@/lib/i18n/content';
import {Accordion, AccordionItem} from '@/components/ui/accordion';
import {Icon} from '@/components/ui/icon';
import {BookOpen, SlidersHorizontal, UserRoundCheck, ChevronRight} from 'lucide-react';
import {toolCategories as categories} from '@/lib/site';
import {wheelHref} from '@/lib/spin-wheels/catalog';
import {WheelCollection} from '@/components/spin-wheels/wheel-collection';
import {translator, type Dictionary} from '@/lib/i18n/config';
import {TranslationMessages} from './provider';
import {PlanningPathways, FinanceToolkit, HealthToolkit, EverydayToolkit, HowItWorks, WorkspaceIntroduction} from '@/components/home/home-details';
import {LearningGuides} from '@/components/home/learning-guides';
import {HomeCta} from '@/components/home/home-cta';
import styles from '@/components/home/home.module.css';

export function LocalizedHome({messages}: {messages: Dictionary}) {
  const t = translator(messages);
  const questions = [
    ['Can I save or share my results?', 'Inputs stay in this browser only when you choose Save calculation. Manage saved results and backups in My workspace.'],
    ['Are the calculators free to use?', 'Yes. Available calculators are free and require no account.'],
    ['Does changing language change tax rules or currency?', 'No. Language changes the interface. Check the region, currency, and units shown in each calculator.'],
    ['Do my inputs leave my device?', 'Most calculations run in your browser without an account. Road mileage sends selected locations to map services. Reference-data modes retrieve public snapshots without sending your entered amount or selected pair. The privacy policy explains local files, sharing, and optional browser-assistant tools.'],
  ];
  return <>
    <TranslationMessages messages={homeMessages(messages, Object.values(featuredTools).flat())}><HomeExplorer/></TranslationMessages>
    <section className={`container ${styles.section}`} aria-labelledby="categories-title">
      <div className={styles.sectionHeading}><h2 id="categories-title">{t('Browse by category')}</h2></div>
      <div className={styles.categoryGrid}>{categories.filter(category => category.id !== 'everyday').map(category => <article className={styles.category} data-category={category.id} key={category.id}>
        <span className={styles.categoryIcon}><Icon name={category.icon} size={25}/></span><h3><Link href={category.href}>{t(category.name)}</Link></h3><p>{t(category.description)}</p>
        <ul>{category.links.map(link => <li key={link.slug}><Link href={category.id==='time'?(timeTools.find(tool=>tool.slug===link.slug)?.href||'/time'):category.id==='spin-wheels'?wheelHref(link.slug):`/${link.slug}`}>{t(`tool.${link.slug}`)}</Link></li>)}</ul>
        <Link className={styles.categoryAll} href={category.href}>{t(category.id==='time'?'Explore time tools':category.id==='spin-wheels'?'Explore spin wheels':'All calculators')}<ChevronRight size={15}/></Link>
      </article>)}</div>
    </section>
    <WheelCollection messages={messages} homepage/>
    <TimeCollection messages={messages} homepage/>
    <PlanningPathways messages={messages}/>
    <FinanceToolkit messages={messages}/>
    <HealthToolkit messages={messages}/>
    <EverydayToolkit messages={messages}/>
    <HowItWorks messages={messages}/>
    <PercentageDemo/>
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
    <section className={`container ${styles.section} ${styles.faq}`} aria-labelledby="faq-title"><div className={styles.faqIntro}><h2 id="faq-title">{t('Good to know.')}</h2><p><Link href="/faq">{t('Browse all FAQs')}</Link></p></div><Accordion>{questions.map(([question, answer]) => <AccordionItem key={question} title={t(question)}><p>{t(answer)}</p></AccordionItem>)}</Accordion></section>
    <HomeCta messages={messages}/>
  </>;
}
