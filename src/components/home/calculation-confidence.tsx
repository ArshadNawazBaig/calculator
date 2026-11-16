import type {ReactNode} from 'react';
import Link from '@/components/i18n/link';
import {BookOpen, SlidersHorizontal, UserRoundCheck, ChevronRight, type LucideIcon} from 'lucide-react';
import type {Dictionary} from '@/lib/i18n/config';
import {HomeSectionImage} from './home-section-image';
import styles from './confidence-section.module.css';

type Benefit = {icon: LucideIcon; title: string; text: string};
type ConfidenceSectionProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  linkLabel: string;
  benefits: Benefit[];
  messages?: Dictionary;
};

const benefits: Benefit[] = [
  {icon: BookOpen, title: 'See how the answer is worked out.', text: 'Read the formula, follow a worked example, and check the assumptions behind your result.'},
  {icon: SlidersHorizontal, title: 'Make room for “what if?”', text: 'Change a rate, a date, or an amount. Explore different scenarios before deciding what comes next.'},
  {icon: UserRoundCheck, title: 'Get straight to the useful part.', text: 'Open a calculator and start. There’s no account to create or subscription to unlock.'},
];

/** English and translated copy share the same image-led section layout. */
export function ConfidenceSection({eyebrow, title, description, linkLabel, benefits, messages = {}}: ConfidenceSectionProps) {
  return <section className={styles.section} aria-labelledby="confidence-title">
    <div className="container">
      <header className={styles.intro}>
        <div className={styles.copy}><span className={styles.eyebrow}>{eyebrow}</span><h2 id="confidence-title">{title}</h2><p>{description}</p></div>
        <Link className={styles.editorialLink} href="/editorial-policy">{linkLabel}<ChevronRight size={16} aria-hidden="true"/></Link>
      </header>
      <div className={styles.panel}>
        <div className={styles.media}><HomeSectionImage image="confidence" messages={messages} className={styles.image} sizes="(max-width: 600px) calc(100vw - 36px), (max-width: 1100px) calc(100vw - 40px), (max-width: 1344px) calc((100vw - 96px) * .4), 500px"/></div>
        <ul className={styles.benefits}>{benefits.map(({icon: BenefitIcon, title: benefitTitle, text}) => <li className={styles.benefit} key={benefitTitle}>
          <span className={styles.icon}><BenefitIcon size={21} aria-hidden="true"/></span><div><h3>{benefitTitle}</h3><p>{text}</p></div>
        </li>)}</ul>
      </div>
    </div>
  </section>;
}

export function CalculationConfidence() {
  return <ConfidenceSection eyebrow="Clarity comes from context" title={<>Understand the number.<br/>{' '}Then make your move.</>}
    description="A useful answer comes with an explanation. Finflo helps you see what goes into a calculation and what the result means."
    linkLabel="Our approach to accuracy" benefits={benefits}/>;
}
