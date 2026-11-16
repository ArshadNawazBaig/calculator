import Link from '@/components/i18n/link';
import {ArrowUpRight, ArrowRight, Star, FolderHeart, GitCompareArrows} from 'lucide-react';
import catalog from '@/data/catalog.json';
import descriptions from '@/data/tool-descriptions.json';
import {translator, type Dictionary} from '@/lib/i18n/config';
import {SectionHeading} from './section-heading';
import {HomeSectionImage} from './home-section-image';
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
  {title: 'Plan for a home', description: 'Start with a budget, estimate a payment, then compare renting and buying.', slugs: ['house-affordability-calculator', 'mortgage-calculator', 'rent-vs-buy-calculator']},
  {title: 'Get your money organized', description: 'Map your monthly budget, explore a debt payoff plan, and make room for savings.', slugs: ['budget-calculator', 'debt-payoff-calculator', 'savings-calculator']},
  {title: 'Explore your fitness numbers', description: 'Explore daily energy estimates, body measurements, and the pace of your next run.', slugs: ['calorie-calculator', 'body-fat-calculator', 'pace-calculator']},
];

export function PlanningPathways({messages = {}}: HomeDetailsProps) {
  const t = translator(messages);
  return <section className={`container ${home.section} ${styles.editorialSection}`} aria-labelledby="planning-title">
    <div className={styles.planningPanel}>
      <div className={styles.planningIntro}>
        <div className={styles.introCopy}><SectionHeading id="planning-title" eyebrow={t('Start with a goal')} title={t('What are you planning next?')} description={t('A few connected tools can help you see the whole picture.')}/></div>
        <div className={styles.featureMedia}><HomeSectionImage image="planning" messages={messages}/></div>
      </div>
      <div className={styles.pathways}>{pathways.map(({title, description, slugs}, index) => <article className={styles.pathway} key={title}>
        <div className={styles.pathwayTop}><h3>{t(title)}</h3><span aria-hidden="true">0{index + 1}</span></div>
        <p>{t(description)}</p>
        <div className={styles.pathwayLinks}>{slugs.map(slug => <ToolLink key={slug} slug={slug} messages={messages}/>)}</div>
      </article>)}</div>
    </div>
  </section>;
}

export function FinanceToolkit({messages = {}}: HomeDetailsProps) {
  const t = translator(messages);
  return <section className={`${styles.band} ${home.section} ${styles.editorialSection}`} aria-labelledby="finance-tools-title">
    <div className="container">
      <SectionHeading id="finance-tools-title" eyebrow={t('Financial calculators')} title={t('Give your money a plan.')} description={t('Plan, save, and make more informed money decisions.')} link={{href: '/calculators/finance', label: t('All financial calculators')}}/>
      <div className={styles.financeGrid}>
        <div className={styles.financeFeature}>
          <div className={styles.featureMedia}><HomeSectionImage image="finance" messages={messages}/></div>
          <div className={styles.financeFeatureCopy}>
            <h3>{t('Small deposits. A longer view.')}</h3>
            <p>{t('Explore how your starting balance, regular contributions, time, and an assumed return work together.')}</p>
            <Link className={home.sectionLink} href="/compound-interest-calculator">{toolTitle('compound-interest-calculator', messages)}<ArrowRight size={17} aria-hidden="true"/></Link>
          </div>
        </div>
        <div className={styles.toolList}>{['loan-calculator', 'savings-calculator', 'retirement-calculator'].map(slug => <ToolLink key={slug} slug={slug} messages={messages} detailed/>)}</div>
      </div>
    </div>
  </section>;
}

export function HealthToolkit({messages = {}}: HomeDetailsProps) {
  const t = translator(messages);
  return <section className={`container ${home.section} ${styles.editorialSection}`} aria-labelledby="health-tools-title">
    <SectionHeading id="health-tools-title" eyebrow={t('Health & fitness calculators')} title={t('Understand the numbers behind your routine.')} description={t('Explore energy needs, body measurements, and exercise estimates with the assumptions in view.')} link={{href: '/calculators/health', label: t('All health calculators')}}/>
    <div className={styles.healthGrid}>
      <div className={`${styles.featureMedia} ${styles.healthMedia}`}><HomeSectionImage image="health" messages={messages} sizes="(max-width: 1100px) calc(100vw - 36px), (max-width: 1344px) 44vw, 560px"/></div>
      <div className={styles.healthTools}>{['bmr-calculator', 'calorie-calculator', 'pace-calculator'].map(slug => <ToolLink key={slug} slug={slug} messages={messages} detailed/>)}</div>
    </div>
  </section>;
}

const everydayGroups = [
  {title: 'Percentages & fractions', description: 'Check a change, simplify a fraction, or work through a proportion.', slugs: ['percent-calculator', 'fraction-calculator', 'ratio-calculator']},
  {title: 'Dates & time', description: 'Count days, shift a date, or add up hours and minutes.', slugs: ['date-calculator', 'time-calculator']},
  {title: 'Units & measurements', description: 'Convert between units and work out the area of a space.', slugs: ['conversion-calculator', 'area-calculator', 'volume-calculator']},
  {title: 'Bills & projects', description: 'Split a restaurant bill or estimate materials for your next project.', slugs: ['tip-calculator', 'concrete-calculator']},
];

export function EverydayToolkit({messages = {}}: HomeDetailsProps) {
  const t = translator(messages);
  return <section className={`container ${home.section} ${styles.editorialSection}`} aria-labelledby="everyday-tools-title">
    <div className={styles.everydayPanel}>
      <div className={styles.everydayIntro}>
        <div className={styles.introCopy}><SectionHeading id="everyday-tools-title" eyebrow={t('Math meets everyday life')} title={t('Small questions. Useful answers.')} description={t('For the numbers that turn up in your day, keep the right tools close.')}/></div>
        <div className={styles.featureMedia}><HomeSectionImage image="everyday" messages={messages} sizes="(max-width: 960px) calc(100vw - 36px), (max-width: 1344px) 40vw, 500px"/></div>
      </div>
      <div className={styles.everydayGrid}>{everydayGroups.map(({title, description, slugs}) => <article className={styles.everydayGroup} key={title}>
        <h3>{t(title)}</h3><p>{t(description)}</p>
        <div>{slugs.map(slug => <ToolLink key={slug} slug={slug} messages={messages}/>)}</div>
      </article>)}</div>
    </div>
  </section>;
}

const steps = [
  {title: 'Find your tool', description: 'Search for a calculator or browse by the question you want to answer.'},
  {title: 'Make it your scenario', description: 'Enter your values and select Calculate to see the result and its breakdown.'},
  {title: 'Look beyond the result', description: 'Check units and assumptions before using a result.'},
];

export function HowItWorks({messages = {}}: HomeDetailsProps) {
  const t = translator(messages);
  return <section className={`${styles.band} ${home.section} ${styles.editorialSection}`} aria-labelledby="how-it-works-title">
    <div className="container">
      <SectionHeading id="how-it-works-title" eyebrow={t('How it works')} title={t('From a question to a clearer next step.')}/>
      <div className={styles.stepsPanel}>
        <div className={styles.featureMedia}><HomeSectionImage image="how-it-works" messages={messages} sizes="(max-width: 1100px) calc(100vw - 36px), (max-width: 1344px) 44vw, 560px"/></div>
        <ol className={styles.steps}>{steps.map(({title, description}, index) => <li key={title}>
          <span className={styles.stepNumber} aria-hidden="true">0{index + 1}</span>
          <div><h3>{t(title)}</h3><p>{t(description)}</p></div>
        </li>)}</ol>
      </div>
    </div>
  </section>;
}

export function WorkspaceIntroduction({messages = {}}: HomeDetailsProps) {
  const t = translator(messages);
  return <section className={`container ${home.section} ${styles.editorialSection}`} aria-labelledby="workspace-title">
    <div className={styles.workspace}>
      <div className={styles.workspaceHero}>
      <div className={styles.workspaceCopy}>
        <span className={home.eyebrow}>{t('My workspace')}</span>
        <h2 id="workspace-title">{t('Keep your next decision in one place.')}</h2>
        <p>{t('Your favorite tools, saved calculations, and scenarios in one place.')}</p>
        <Link className="button button-primary" href="/workspace">{t('Open my workspace')}<ArrowRight size={17} aria-hidden="true"/></Link>
        <p className={styles.workspaceNote}>{t('Saved only in this browser. Clear site data and your saved items will be removed.')} {t('Export a backup to keep a copy or move your workspace to another device.')}</p>
      </div>
      <div className={styles.featureMedia}><HomeSectionImage image="workspace" messages={messages} sizes="(max-width: 1100px) calc(100vw - 36px), (max-width: 1344px) 48vw, 600px"/></div>
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
