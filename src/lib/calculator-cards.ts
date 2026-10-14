import descriptions from "@/data/tool-descriptions.json";
import type {ToolListing} from "@/lib/tool-listings";
import type {CalculatorCardData} from "@/components/calculators/calculator-card";

/** Uses the existing original descriptions without shipping calculation engines to listings. */
export function calculatorCardData(tool:Pick<ToolListing,"slug"|"title"|"category"|"type"|"href"|"description"|"favorite">):CalculatorCardData {
  const directory=tool.type==="directory";
  return {
    slug:tool.slug,title:tool.title,category:tool.category,
    description:tool.description || (directory?"Explore mortgage, affordability, refinancing, and property investment calculators.":(descriptions as Record<string,string>)[tool.slug]),
    href:tool.href,favorite:tool.favorite,
    status:directory?"directory":"available",
  };
}
