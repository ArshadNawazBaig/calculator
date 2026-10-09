import {HomeExplorer} from "@/components/home/home-explorer";
import {BrowseCategories} from "@/components/home/browse-categories";
import {site} from "@/lib/site";
import {pageMetadata} from "@/lib/metadata";
import {JsonLd} from "@/components/content/json-ld";

export const metadata=pageMetadata("Free calculators for life’s big and small decisions",site.description,"/");
export default function Home() {
  return <>
    <JsonLd data={{"@context":"https://schema.org","@type":"WebSite",name:"Finflo",url:site.url,description:site.description}}/>
    <div className="container"><HomeExplorer/><BrowseCategories/></div>
  </>;
}
