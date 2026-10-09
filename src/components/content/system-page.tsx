import Link from 'next/link';
import {PageHero} from './page-hero';

export function SystemPage({code,title,description,children}:{code:string;title:string;description:string;children?:React.ReactNode}){
  return <PageHero variant="system" eyebrow={code==='404'?'ERROR 404':`FINFLO · ${code}`} title={title} description={description}>
    {children}
    <Link className={`button ${children?'button-secondary':'button-primary'}`} href="/calculators">Browse calculators</Link>
    <Link className="button button-ghost" href="/">Go home</Link>
  </PageHero>;
}
