import Link from "next/link";
import {BookOpen, LockKeyhole} from "lucide-react";
import {Search} from "@/components/search";
import {MortgagePreview} from "@/components/calculators/mortgage-preview";
import {CategoryCard} from "@/components/home/category-card";
import {PopularTools} from "@/components/home/popular-tools";
import {categories, site} from "@/lib/site";
import {pageMetadata} from "@/lib/metadata";
import {JsonLd} from "@/components/content/json-ld";

export const metadata=pageMetadata("Free calculators for clearer decisions",site.description,"/");

export default function Home() {
  return <>
    <JsonLd data={{"@context":"https://schema.org","@type":"WebSite",name:"Finflo",url:site.url,description:site.description}}/>
    <section className="hero"><div className="container hero-grid">
      <div className="hero-copy">
        <span className="eyebrow">Free online calculators</span>
        <h1>Every calculation.<br/><span>A clearer decision.</span></h1>
        <p className="hero-description">Free calculators for your money, health,<br className="desktop-break"/> and the questions that come up every day.</p>
        <Search/>
        <div className="suggestions"><span>Try:</span>{[["Mortgage","mortgage-calculator"],["BMI","bmi-calculator"],["Percentage","percent-calculator"]].map(([label,slug]) => <Link key={slug} href={`/${slug}`}>{label}</Link>)}</div>
        <p className="hero-note"><LockKeyhole size={16} aria-hidden="true"/> Free to use. No account required.</p>
      </div>
      <MortgagePreview/>
    </div></section>
    <div className="container home-content">
      <section className="category-grid" aria-label="Calculator categories">{categories.map(category => <CategoryCard key={category.id} category={category}/>)}</section>
      <PopularTools/>
      <section className="clarity-strip">
        <BookOpen size={30} strokeWidth={1.75} aria-hidden="true"/>
        <div><h2>Understand your results.</h2><p>Explore the formulas, examples, and assumptions behind your results.</p></div>
        <Link href="/methodology" className="text-link">Our methodology</Link>
      </section>
    </div>
  </>;
}
