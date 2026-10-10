import descriptions from "@/data/tool-descriptions.json";
import type {CatalogEntry} from "@/lib/calculators/types";
import type {CalculatorCardData} from "@/components/calculators/calculator-card";

/** Uses the existing original descriptions without shipping calculation engines to listings. */
export function calculatorCardData(tool:Pick<CatalogEntry,"slug"|"title"|"category"|"type">):CalculatorCardData {
  const directory=tool.type==="directory";
  return {
    slug:tool.slug,title:tool.title,category:tool.category,
    description:directory?"Explore mortgage, affordability, refinancing, and property investment calculators.":(descriptions as Record<string,string>)[tool.slug],
    status:directory?"directory":"available",
  };
}
