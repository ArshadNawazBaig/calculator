import descriptions from "@/data/tool-descriptions.json";
import type {CatalogEntry} from "@/lib/calculators/types";
import type {CalculatorCardData} from "@/components/calculators/calculator-card";

const availability:Record<string,string>={
  "weight-watchers-points-calculator":"A verified, authorized points method is not available yet. Explore the current scope and alternatives.",
};

/** Uses the existing original descriptions without shipping calculation engines to listings. */
export function calculatorCardData(tool:Pick<CatalogEntry,"slug"|"title"|"category"|"type">):CalculatorCardData {
  const unavailable=availability[tool.slug];
  const directory=tool.type==="directory";
  return {
    slug:tool.slug,title:tool.title,category:tool.category,
    description:unavailable||(directory?"Explore mortgage, affordability, refinancing, and property investment calculators.":(descriptions as Record<string,string>)[tool.slug]),
    status:unavailable?"unavailable":directory?"directory":"available",
  };
}
