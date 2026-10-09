import Link from "next/link";
import {ChevronRight} from "lucide-react";
import {guides} from "@/data/guides";
import {SectionHeading} from "./section-heading";
import styles from "./home.module.css";

const featuredGuides=[
  {slug:"understanding-mortgage-payments",topic:"Home & money",number:"01",description:"See where your monthly payment goes, from principal and interest to the other costs of owning a home."},
  {slug:"compound-interest-and-contributions",topic:"Saving & investing",number:"02",description:"Get to know the role of time, regular deposits, and compounding in a savings projection."},
  {slug:"bmi-as-a-screening-tool",topic:"Health & wellbeing",number:"03",description:"Put a familiar health metric in context, with a clear look at its calculation and limitations."},
];

export function LearningGuides() {
  return <section className={`container ${styles.section}`} aria-labelledby="guides-title">
    <SectionHeading id="guides-title" eyebrow="The reading room" title="A little knowledge goes further." description="Practical guides to the ideas behind the numbers." link={{href:"/guides",label:"Explore all guides"}}/>
    <div className={styles.guideGrid}>{featuredGuides.map(item=><article className={styles.guide} key={item.slug}>
      <div className={styles.guideMeta}><span>{item.topic}</span><span aria-hidden="true">{item.number}</span></div>
      <h3><Link href={`/guides/${item.slug}`}>{guides[item.slug].title}</Link></h3>
      <p>{item.description}</p><Link className={styles.sectionLink} href={`/guides/${item.slug}`} aria-label={`Read the guide: ${guides[item.slug].title}`}>Read the guide<ChevronRight size={16} aria-hidden="true"/></Link>
    </article>)}</div>
  </section>;
}
