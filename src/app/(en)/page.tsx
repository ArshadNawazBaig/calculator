import {HomeExplorer} from "@/components/home/home-explorer";
import {BrowseCategories} from "@/components/home/browse-categories";
import {CalculationConfidence} from "@/components/home/calculation-confidence";
import {LearningGuides} from "@/components/home/learning-guides";
import {HomeFaq} from "@/components/home/home-faq";
import {HomeCta} from "@/components/home/home-cta";
import {PlanningPathways,FinanceToolkit,HealthToolkit,EverydayToolkit,HowItWorks,WorkspaceIntroduction} from "@/components/home/home-details";
import {site} from "@/lib/site";
import {pageMetadata} from "@/lib/metadata";
import {JsonLd} from "@/components/content/json-ld";
import {organizationData} from "@/lib/structured-data";

export const metadata=pageMetadata("Free Finance, Health, Math & Everyday Calculators",site.description,"/");
export default function Home() {
  return <>
    <JsonLd data={{"@context":"https://schema.org","@type":"WebSite",name:"Finflo",url:site.url,description:site.description}}/>
    <JsonLd data={{"@context":"https://schema.org",...organizationData()}}/>
    <HomeExplorer/>
    <BrowseCategories/>
    <PlanningPathways/>
    <FinanceToolkit/>
    <HealthToolkit/>
    <EverydayToolkit/>
    <HowItWorks/>
    <CalculationConfidence/>
    <WorkspaceIntroduction/>
    <LearningGuides/>
    <HomeFaq/>
    <HomeCta/>
  </>;
}
