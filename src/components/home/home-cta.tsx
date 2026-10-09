import Link from "@/components/i18n/link";
import {ChevronRight} from "lucide-react";
import styles from "./home.module.css";

export function HomeCta() {
  return <section className={`container ${styles.closing}`} aria-labelledby="closing-title"><div><h2 id="closing-title">Your next answer is a calculation away.</h2><p>Money, health, math, and the everyday. Find the tool you need.</p></div><Link className="button button-primary" href="/calculators">Browse all calculators<ChevronRight size={17} aria-hidden="true"/></Link></section>;
}
