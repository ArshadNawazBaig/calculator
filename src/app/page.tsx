import Link from "next/link";
import {ShieldCheck, BookOpen, Zap, ChevronRight} from "lucide-react";
import {Search} from "@/components/search";
import {MortgagePreview} from "@/components/calculators/mortgage-preview";
import {CategoryCard} from "@/components/home/category-card";
import {PopularTools} from "@/components/home/popular-tools";
import {categories} from "@/lib/site";
import {pageMetadata} from "@/lib/metadata";
import {JsonLd} from "@/components/content/json-ld";
import {site} from "@/lib/site";
export const metadata=pageMetadata("Free calculators for clearer decisions",site.description,"/");
export default function Home(){return <><JsonLd data={{"@context":"https://schema.org","@type":"WebSite",name:"Finflo",url:site.url,description:site.description}}/><section className="hero"><div className="container hero-grid"><div className="hero-copy"><span className="eyebrow"><span className="eyebrow-line"/>FREE ONLINE CALCULATORS</span><h1>Every calculation.<br/><span>A clearer decision.</span></h1><p className="hero-description">Simple tools for money, health, math,<br className="desktop-break"/> and everything life adds up to.</p><Search/><div className="suggestions"><span>Popular:</span>{[["Mortgage","mortgage-calculator"],["BMI","bmi-calculator"],["Percentage","percent-calculator"]].map(([label,slug])=><Link key={slug} href={`/${slug}`}>{label}</Link>)}</div><div className="hero-note"><ShieldCheck size={15}/><span>Free to use.</span><span className="note-separator"/><span>No sign-up needed.</span></div></div><MortgagePreview/></div></section><div className="container home-content"><section className="category-grid" aria-label="Calculator categories">{categories.map(category=><CategoryCard key={category.id} category={category}/>)}</section><PopularTools/><section className="clarity-strip"><div className="clarity-intro"><span className="clarity-icon"><BookOpen size={27}/></span><div><h2>More than an answer.</h2><p>Understand the numbers behind your next step.</p></div></div><div className="clarity-feature"><Zap size={20}/><span>Quick, useful results</span></div><div className="clarity-feature"><BookOpen size={20}/><span>Formulas, explained</span></div><Link href="/methodology" className="text-link">Our approach<ChevronRight size={15}/></Link></section></div></>;}
