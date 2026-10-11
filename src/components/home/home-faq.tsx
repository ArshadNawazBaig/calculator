import Link from "@/components/i18n/link";
import {Accordion,AccordionItem} from "@/components/ui/accordion";
import styles from "./home.module.css";

const questions=[
  {question:"Are the calculators free to use?",answer:"Yes. Finflo’s available calculators are free to use, with no account or subscription required."},
  {question:"Can I use Finflo outside the United States?",answer:"Yes. Many tools support metric and US customary units. Currency, tax rules, and financial assumptions vary by calculator, so check the units and region shown on the tool you use."},
  {question:"How do I understand or check a result?",answer:"Calculator pages include formulas, assumptions, worked examples, and relevant source references. Check that your inputs and selected units match the scenario you want to explore."},
  {question:"Can I save or share my results?",answer:"Most calculators let you download results as CSV or PDF, or print them. Copy tool link shares the calculator’s page address without your inputs or results."},
];

export function HomeFaq() {
  return <section className={`container ${styles.section} ${styles.faq}`} aria-labelledby="faq-title">
    <div className={styles.faqIntro}><span className={styles.eyebrow}>A few helpful answers</span><h2 id="faq-title">Good to know.</h2><p>Have something else in mind?<br/><Link href="/contact">Get in touch with Finflo.</Link></p></div>
    <Accordion>{questions.map(({question,answer})=><AccordionItem key={question} title={question}><p>{answer}</p></AccordionItem>)}</Accordion>
  </section>;
}
