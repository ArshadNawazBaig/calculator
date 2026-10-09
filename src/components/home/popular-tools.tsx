import Link from "next/link";
import {Icon} from "@/components/ui/icon";

const tools=[
  {title:"Compound interest",slug:"compound-interest-calculator",icon:"investment",text:"See how your savings could grow.",category:"Finance"},
  {title:"Salary",slug:"salary-calculator",icon:"salary",text:"Compare hourly, monthly, and annual pay.",category:"Finance"},
  {title:"Calorie",slug:"calorie-calculator",icon:"calorie",text:"Estimate your daily energy needs.",category:"Health & fitness"},
  {title:"Age",slug:"age-calculator",icon:"age",text:"Calculate an age in years, months, and days.",category:"Everyday"},
];

export function PopularTools() {
  return <section className="popular-section">
    <div className="section-heading"><div><h2>Popular calculators</h2></div><Link className="text-link" href="/calculators">View all calculators</Link></div>
    <div className="popular-grid">{tools.map(tool =>
      <Link className="popular-card" key={tool.slug} href={`/${tool.slug}`}>
        <span className="tool-icon"><Icon name={tool.icon} size={25}/></span>
        <div className="popular-copy"><h3>{tool.title}</h3><p>{tool.text}</p></div>
        <span className="tool-category">{tool.category}</span>
      </Link>
    )}</div>
  </section>;
}
