import data from "@/data/catalog.json";
import type {CatalogEntry} from "@/lib/calculators/types";
import type {CategoryId} from "@/lib/site";

function normalize(value:string) {
  return value.normalize("NFKD").replace(/\p{M}/gu,"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
}

const index=(data as CatalogEntry[]).map(tool=>({
  tool,
  title:normalize(tool.title),
  text:normalize(`${tool.title} ${tool.slug} ${tool.category} ${tool.subcategory}`),
}));

/** Shared by live suggestions and the full results page. No calculation engines are loaded. */
export function searchCalculators(query:string,category?:CategoryId):CatalogEntry[] {
  const phrase=normalize(query);
  if(!phrase)return [];
  const terms=phrase.split(/\s+/);
  return index
    .filter(item=>(!category||item.tool.category===category)&&terms.every(term=>item.text.includes(term)))
    .map(item=>{
      const name=item.title.replace(/\s+calculator$/,"");
      const score=(name===phrase||item.title===phrase?1000:item.title.startsWith(phrase)?500:item.title.includes(phrase)?250:0)
        +terms.reduce((total,term)=>total+(item.title.split(" ").some(word=>word.startsWith(term))?30:item.title.includes(term)?10:0),0);
      return {tool:item.tool,score};
    })
    .sort((a,b)=>b.score-a.score||a.tool.title.localeCompare(b.tool.title))
    .map(item=>item.tool);
}
