import Link from '@/components/i18n/link';
import {ArrowUpRight, ArrowRight, House, Wallet, TrendingUp, HeartPulse, Footprints, Percent, CalendarDays, Ruler, Calculator, Search, SlidersHorizontal, BookOpen, Star, FolderHeart, GitCompareArrows} from 'lucide-react';
import catalog from '@/data/catalog.json';
import descriptions from '@/data/tool-descriptions.json';
import {translator, type Dictionary} from '@/lib/i18n/config';
import {SectionHeading} from './section-heading';
import home from './home.module.css';
import styles from './home-details.module.css';

type HomeDetailsProps = {messages?: Dictionary};
const toolNames = new Map(catalog.map(tool => [tool.slug, tool.title]));

function toolTitle(slug: string, messages: Dictionary) {
  return messages[`tool.${slug}`] || toolNames.get(slug) || slug;
}

function ToolLink({slug, messages, detailed = false}: {slug: string; messages: Dictionary; detailed?: boolean}) {
  const description = messages[`description.${slug}`] || descriptions[slug as keyof typeof descriptions];
  return <Link className={styles.toolLink} href={`/${slug}`}>
    <span><strong>{toolTitle(slug, messages)}</strong>{detailed && <span>{description}</span>}</span>
    <ArrowUpRight size={19} aria-hidden="true"/>
  </Link>;
}

const pathways = [
  {icon: House, title: 'Plan for a home', description: 'Start with a budget, estimate a payment, then compare renting and buying.', slugs: ['house-affordability-calculator', 'mortgage-calculator', 'rent-vs-buy-calculator']},
  {icon: Wallet, title: 'Get your money organized', description: 'Map your monthly budget, explore a debt payoff plan, and make room for savings.', slugs: ['budget-calculator', 'debt-payoff-calculator', 'savings-calculator']},
  {icon: Footprints, title: 'Explore your fitness numbers', description: 'Explore daily energy estimates, body measurements, and the pace of your next run.', slugs: ['calorie-calculator', 'body-fat-calculator', 'pace-calculator']},
];

export function PlanningPathways({messages = {}}: HomeDetailsProps) {
  const t = translator(messages);
  return <section className={`container ${home.section}`} aria-labelledby="planning-title">
    <SectionHeading id="planning-title" eyebrow={t('Start with a goal')} title={t('What are you planning next?')} description={t('A few connected tools can help you see the whole picture.')}/>
    <div className={styles.pathways}>{pathways.map(({icon: Icon, title, description, slugs}, index) => <article className={styles.pathway} key={title}>
      <div className={styles.pathwayTop}><Icon size={27} aria-hidden="true"/><span aria-hidden="true">0{index + 1}</span></div>
      <h3>{t(title)}</h3><p>{t(description)}</p>
      <div className={styles.pathwayLinks}>{slugs.map(slug => <ToolLink key={slug} slug={slug} messages={messages}/>)}</div>
    </article>)}</div>
  </section>;
}

export function FinanceToolkit({messages = {}}: HomeDetailsProps) {
  const t = translator(messages);
  return <section className={`${styles.band} ${home.section}`} aria-labelledby="finance-tools-title">
    <div className="container">
      <SectionHeading id="finance-tools-title" eyebrow={t('Financial calculators')} title={t('Give your money a plan.')} description={t('Plan, save, and make more informed money decisions.')} link={{href: '/calculators/finance', label: t('All financial calculators')}}/>
      <div className={styles.financeGrid}>
        <div className={styles.financeFeature}>
          <span className={styles.iconTile}><TrendingUp size={26} aria-hidden="true"/></span>
          <h3>{t('Small deposits. A longer view.')}</h3>
          <p>{t('Explore how your starting balance, regular contributions, time, and an assumed return work together.')}</p>
          <div className={styles.growthBars} aria-hidden="true">{[16, 23, 32, 43, 56, 72, 89, 100].map(height => <span key={height} style={{height: `${height}%`}}/>)}</div>
          <Link className={home.sectionLink} href="/compound-interest-calculator">{toolTitle('compound-interest-calculator', messages)}<ArrowRight size={17} aria-hidden="true"/></Link>
        </div>
        <div className={styles.toolList}>{['loan-calculator', 'savings-calculator', 'retirement-calculator'].map(slug => <ToolLink key={slug} slug={slug} messages={messages} detailed/>)}</div>
      </div>
    </div>
  </section>;
}

export function HealthToolkit({messages = {}}: HomeDetailsProps) {
  const t = translator(messages);
  return <section className={`container ${home.section}`} aria-labelledby="health-tools-title">
    <div className={styles.healthGrid}>
      <div className={styles.healthIntro}>
        <span className={styles.iconTile}><HeartPulse size={28} aria-hidden="true"/></span>
        <SectionHeading id="health-tools-title" eyebrow={t('Health & fitness calculators')} title={t('Understand the numbers behind your routine.')} description={t('Explore energy needs, body measurements, and exercise estimates with the assumptions in view.')}/>
        <Link className={home.sectionLink} href="/calculators/health">{t('All health calculators')}<ArrowRight size={17} aria-hidden="true"/></Link>
      </div>
      <div className={styles.healthTools}>{['bmr-calculator', 'calorie-calculator', 'pace-calculator'].map(slug => <ToolLink key={slug} slug={slug} messages={messages} detailed/>)}</div>
    </div>
  </section>;
}

const everydayGroups = [
  {icon: Percent, title: 'Percentages & fractions', description: 'Check a change, simplify a fraction, or work through a proportion.', slugs: ['percent-calculator', 'fraction-calculator', 'ratio-calculator']},
  {icon: CalendarDays, title: 'Dates & time', description: 'Count days, shift a date, or add up hours and minutes.', slugs: ['date-calculator', 'time-calculator']},
  {icon: Ruler, title: 'Units & measurements', description: 'Convert between units and work out the area of a space.', slugs: ['conversion-calculator', 'area-calculator', 'volume-calculator']},
  {icon: Calculator, title: 'Bills & projects', description: 'Split a restaurant bill or estimate materials for your next project.', slugs: ['tip-calculator', 'concrete-calculator']},
];

export function EverydayToolkit({messages = {}}: HomeDetailsProps) {
  const t = translator(messages);
  return <section className={`container ${home.section} ${styles.everyday}`} aria-labelledby="everyday-tools-title">
    <SectionHeading id="everyday-tools-title" eyebrow={t('Math meets everyday life')} title={t('Small questions. Useful answers.')} description={t('For the numbers that turn up in your day, keep the right tools close.')}/>
    <div className={styles.everydayGrid}>{everydayGroups.map(({icon: Icon, title, description, slugs}) => <article className={styles.everydayGroup} key={title}>
      <Icon size={24} aria-hidden="true"/><h3>{t(title)}</h3><p>{t(description)}</p>
      <div>{slugs.map(slug => <ToolLink key={slug} slug={slug} messages={messages}/>)}</div>
    </article>)}</div>
  </section>;
}

const steps = [
  {icon: Search, title: 'Find your tool', description: 'Search for a calculator or browse by the question you want to answer.'},
  {icon: SlidersHorizontal, title: 'Make it your scenario', description: 'Enter your values and select Calculate to see the result and its breakdown.'},
  {icon: BookOpen, title: 'Look beyond the result', description: 'Check units and assumptions before using a result.'},
];

export function HowItWorks({messages = {}}: HomeDetailsProps) {
  const t = translator(messages);
  return <section className={`${styles.stepsBand} ${home.section}`} aria-labelledby="how-it-works-title">
    <div className="container">
      <SectionHeading id="how-it-works-title" eyebrow={t('How it works')} title={t('From a question to a clearer next step.')}/>
      <ol className={styles.steps}>{steps.map(({icon: Icon, title, description}, index) => <li key={title}>
        <div className={styles.stepTop}><span aria-hidden="true">0{index + 1}</span><Icon size={23} aria-hidden="true"/></div>
        <h3>{t(title)}</h3><p>{t(description)}</p>
      </li>)}</ol>
    </div>
  </section>;
}

export function WorkspaceIntroduction({messages = {}}: HomeDetailsProps) {
  const t = translator(messages);
  return <section className={`container ${home.section}`} aria-labelledby="workspace-title">
    <div className={styles.workspace}>
      <div className={styles.workspaceCopy}>
        <span className={home.eyebrow}>{t('My workspace')}</span>
        <h2 id="workspace-title">{t('Keep your next decision in one place.')}</h2>
        <p>{t('Your favorite tools, saved calculations, and scenarios in one place.')}</p>
        <Link className="button button-primary" href="/workspace">{t('Open my workspace')}<ArrowRight size={17} aria-hidden="true"/></Link>
        <p className={styles.workspaceNote}>{t('Saved only in this browser. Clear site data and your saved items will be removed.')} {t('Export a backup to keep a copy or move your workspace to another device.')}</p>
      </div>
      <div className={styles.workspaceFeatures}>
        {[
          {icon: Star, title: 'Keep your go-to tools close.', description: 'Select the star on any calculator to find it here.'},
          {icon: FolderHeart, title: 'Give your next calculation a name.', description: 'Run a calculator, name the result, and choose Save calculation. It will be waiting here when you return.'},
          {icon: GitCompareArrows, title: 'Compare scenarios', description: 'Compare up to three saved results from the same calculator, mode, and currency. Differences are measured against the first scenario.'},
        ].map(({icon: Icon, title, description}) => <div className={styles.workspaceFeature} key={title}><Icon size={22} aria-hidden="true"/><div><h3>{t(title)}</h3><p>{t(description)}</p></div></div>)}
      </div>
    </div>
  </section>;
}
