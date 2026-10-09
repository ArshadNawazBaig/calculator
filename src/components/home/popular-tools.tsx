import Link from "next/link";
import {CalculatorCard} from "@/components/calculators/calculator-card";
import {featuredTools} from "@/lib/home-content";

export function PopularTools() {
  return <section className="popular-section">
    <div className="section-heading"><h2>Popular calculators</h2><Link className="text-link" href="/calculators">View all calculators</Link></div>
    <div className="popular-grid">{featuredTools.all.map(tool=><CalculatorCard key={tool.slug} tool={tool}/>)}</div>
  </section>;
}
