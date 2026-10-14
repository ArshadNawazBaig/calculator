import Link from "@/components/i18n/link";
import {BookOpen, Check, ChevronRight, UserRoundCheck} from "lucide-react";
import {Icon} from "@/components/ui/icon";
import {toolCategories as categories} from "@/lib/site";
import {translator, type Dictionary} from "@/lib/i18n/config";
import styles from "./home.module.css";

export function HomeCta({messages = {}}: {messages?: Dictionary}) {
  const t = translator(messages);
  return <section className={`container ${styles.closing}`} data-theme-surface="dark" aria-labelledby="closing-title">
    <div className={styles.closingCopy}>
      <span className={styles.eyebrow}>{t("The calculator library")}</span>
      <h2 id="closing-title">{t("Your next answer is a calculation away.")}</h2>
      <p>{t("Free calculators for money, health, math, and everyday life.")} {t("Change a rate, a date, or an amount to explore different scenarios.")}</p>
      <Link className={`button button-primary ${styles.closingButton}`} href="/calculators">{t("Browse all calculators")}<ChevronRight size={17} aria-hidden="true"/></Link>
      <ul className={styles.closingPromises}>
        <li><Check size={16} aria-hidden="true"/>{t("Always free")}</li>
        <li><UserRoundCheck size={16} aria-hidden="true"/>{t("No account needed")}</li>
        <li><BookOpen size={16} aria-hidden="true"/>{t("Formulas explained")}</li>
      </ul>
    </div>
    <ul className={styles.closingCategories}>
      {categories.map(category => <li key={category.id}>
        <Link className={styles.closingCategory} href={category.href}>
          <Icon className={styles.closingIcon} name={category.icon} size={24}/>
          <div><h3>{t(category.name)}</h3><p>{t(category.description)}</p></div>
          <ChevronRight className={styles.closingArrow} size={18} aria-hidden="true"/>
        </Link>
      </li>)}
    </ul>
  </section>;
}
