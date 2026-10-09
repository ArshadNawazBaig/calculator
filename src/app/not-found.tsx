import {SystemPage} from '@/components/content/system-page';
import {PopularTools} from '@/components/home/popular-tools';

export default function NotFound(){
  return <>
    <SystemPage code="404" title="Page not found." description="This page may have moved, or the link may be incorrect. Try a calculator below, browse the directory, or head back home."/>
    <div className="container"><PopularTools title="Try a popular calculator"/></div>
  </>;
}
