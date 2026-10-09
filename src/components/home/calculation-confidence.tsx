import Link from "@/components/i18n/link";
import {BookOpen,SlidersHorizontal,UserRoundCheck,ChevronRight} from "lucide-react";
import styles from "./home.module.css";

const benefits=[
  {icon:BookOpen,title:"See how the answer is worked out.",text:"Read the formula, follow a worked example, and check the assumptions behind your result."},
  {icon:SlidersHorizontal,title:"Make room for “what if?”",text:"Change a rate, a date, or an amount. Explore different scenarios before deciding what comes next."},
  {icon:UserRoundCheck,title:"Get straight to the useful part.",text:"Open a calculator and start. There’s no account to create or subscription to unlock."},
];

export function CalculationConfidence() {
  return <section className={styles.confidence} aria-labelledby="confidence-title">
    <div className={`container ${styles.confidenceInner}`}>
      <div className={styles.confidenceIntro}><span className={styles.eyebrow}>Clarity comes from context</span><h2 id="confidence-title">Understand the number.<br/>{" "}Then make your move.</h2><p>A useful answer comes with an explanation. Finflo helps you see what goes into a calculation and what the result means.</p><Link className={styles.sectionLink} href="/editorial-policy">Our approach to accuracy<ChevronRight size={16} aria-hidden="true"/></Link></div>
      <div className={styles.benefits}>{benefits.map(({icon:BenefitIcon,title,text})=><div className={styles.benefit} key={title}><BenefitIcon size={23} aria-hidden="true"/><div><h3>{title}</h3><p>{text}</p></div></div>)}</div>
    </div>
  </section>;
}
