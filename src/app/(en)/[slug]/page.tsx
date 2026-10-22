import {MathSearchAnswer,MathSearchContent} from '@/components/content/math-search-content';
import {organizationData} from '@/lib/structured-data';
import {CalculatorInsight} from '@/components/content/calculator-insight';
import {MethodNavigation} from '@/components/content/method-navigation';
import {isStudentCalculator} from '@/lib/student-tools';
import {StudentTools} from '@/components/content/student-tools';
import {MethodologyNote} from '@/components/content/methodology-note';
import {ToolkitSummary,ToolkitArticleData} from '@/components/content/toolkit-summary';
import {getCalculatorSeoTitle} from '@/lib/toolkit-editorial';
import {DirectoryGuidance} from '@/components/content/directory-guidance';
import {RelatedGuides} from '@/components/content/related-guides';
import {CalculatorGuidance} from '@/components/content/calculator-guidance';
import {PageHero} from '@/components/content/page-hero';
import {CalculatorCard} from '@/components/calculators/calculator-card';
import {calculatorCardData} from '@/lib/calculator-cards';
import {CalculatorQuestions} from '@/components/content/calculator-questions';
import Link from '@/components/document-link';
import {notFound} from 'next/navigation';
import {catalog,definitionMap,toolMap,blocked,relatedTools,noInitialExampleTools,sensitiveTools} from '@/lib/calculators/registry';
import {calculate} from '@/lib/calculators/engine';
import {defaults} from '@/lib/calculators/types';
import {site,categories} from '@/lib/site';
import {pageMetadata} from '@/lib/metadata';
import {information} from '@/data/information';
import {InfoPage} from '@/components/content/info-page';
import {JsonLd} from '@/components/content/json-ld';
import {ToolDirectory} from '@/components/content/tool-directory';
import {CalculatorNavigation} from '@/components/calculators/calculator-navigation';
import {CalculatorForm} from '@/components/calculators/calculator';
import {WorkedExample} from '@/components/content/worked-example';
export const dynamicParams=false;
export function generateStaticParams(){return [...catalog.map(t=>({slug:t.slug})),...Object.keys(information).map(slug=>({slug}))];}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const info=information[slug],tool=toolMap.get(slug),definition=definitionMap.get(slug);if(info)return pageMetadata(({about:'About Finflo',methodology:'Our methodology'} as Record<string,string>)[slug]||info.title,info.description,`/${slug}`);if(tool)return pageMetadata(getCalculatorSeoTitle(slug)||tool.title,definition?.description||blocked[slug]||'Explore calculators for property and home ownership.',`/${slug}`,Boolean(definition));return {};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(information[slug])return <InfoPage page={information[slug]} slug={slug}/>;const tool=toolMap.get(slug);if(!tool)notFound();const category=categories.find(c=>c.id===tool.category)!;const def=definitionMap.get(slug);const currency=slug==='mortgage-calculator-uk'?'GBP':slug==='canadian-mortgage-calculator'?'CAD':'USD';
 if(!def)return <><PageHero eyebrow={category.name} title={tool.title} description={blocked[slug]||'Explore calculations for buying, financing, and owning property.'} breadcrumbs={[{label:category.name,href:`/calculators/${tool.category}`},{label:tool.title}]}/><div className="container tool-page page-content">{blocked[slug]?<div className="availability-panel"><h2>Not available yet</h2><p>{blocked[slug]}</p><Link className="text-link" href="/calorie-calculator">Explore a related tool</Link></div>:<ToolDirectory tools={catalog.filter(t=>['mortgage-calculator','rent-vs-buy-calculator','rental-property-calculator','refinance-calculator','house-affordability-calculator','down-payment-calculator'].includes(t.slug))} grouped={false}/>}{slug==='real-estate-calculator'&&<DirectoryGuidance path="/calculators/finance/mortgage-and-real-estate"/>}</div></>;
 const initial=noInitialExampleTools.has(slug)?null:await calculate(tool.category,def.modes[0],defaults(def.modes[0]));
 return <><PageHero eyebrow={`${category.name} · FREE ONLINE TOOL`} title={tool.title} description={def.description} highlight={tool.title.includes('Calculator')?tool.title.slice(tool.title.indexOf('Calculator')):undefined} breadcrumbs={[{label:category.name,href:`/calculators/${tool.category}`},{label:tool.title}]}/><div className="container tool-page page-content">{isStudentCalculator(slug)&&<StudentTools compact/>}<CalculatorNavigation/><CalculatorForm key={slug} definition={def} title={tool.title} category={tool.category} initial={initial} currency={currency} privateInput={sensitiveTools.has(slug)}/><div className="tool-reading"><article className="document-body"><MathSearchAnswer slug={slug}/><ToolkitSummary slug={slug}/><section id="how-it-works" tabIndex={-1}><h2>How it works</h2><MethodNavigation modes={def.modes}/></section><CalculatorInsight slug={slug}/><CalculatorGuidance slug={slug}/><MathSearchContent slug={slug}/><RelatedGuides slug={slug}/>{def.modes.map(mode=><section id={`method-${mode.id}`} key={mode.id}><h2>{mode.title}: formula and assumptions</h2><p className="formula-block">{mode.formula}</p><p>{mode.explanation}</p>{mode.notes?.map(note=><p key={note}>{note}</p>)}</section>)}{initial&&<WorkedExample mode={def.modes[0]} result={initial} currency={currency}/>}{def.notes&&<section id="limitations"><h2>What to keep in mind</h2>{def.notes.map(note=><p key={note}>{note}</p>)}</section>}{def.sources.length>0&&<section id="sources"><h2>Formula references</h2><ul>{def.sources.map(source=><li key={source.url}><a href={source.url} rel="noreferrer" target="_blank">{source.title}<span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul><p>References explain the underlying methods; they do not imply endorsement or individual professional review of Finflo.</p></section>}<CalculatorQuestions slug={slug}/><ToolkitArticleData definition={def}/><p className="editorial-note">Prepared by Finflo. See our <Link href="/methodology">methodology</Link> and <Link href="/editorial-policy">editorial policy</Link>. {tool.category==='finance'||tool.category==='health'?<Link href="/disclaimer">Read the relevant professional-advice limitations.</Link>:null}</p></article><aside className="related-tools"><span className="eyebrow">KEEP EXPLORING</span><h2>Related calculators</h2><div className="related-card-grid">{relatedTools(tool).map(t=><CalculatorCard key={t.slug} tool={calculatorCardData(t)} size="compact"/>)}</div><MethodologyNote/></aside></div><JsonLd data={{'@context':'https://schema.org','@type':'WebApplication','@id':`${site.url}/${slug}#calculator`,name:tool.title,url:site.url+'/'+slug,description:def.description,inLanguage:'en',creator:organizationData(),featureList:def.modes.map(mode=>mode.title),applicationCategory:'UtilitiesApplication',operatingSystem:'Any',browserRequirements:'Requires JavaScript for interactive calculations',isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}}}/><JsonLd data={{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{name:'Home',item:site.url},{name:category.name,item:`${site.url}/calculators/${tool.category}`},{name:tool.title,item:`${site.url}/${slug}`}].map((item,i)=>({'@type':'ListItem',position:i+1,...item}))}}/></div></>;
}
