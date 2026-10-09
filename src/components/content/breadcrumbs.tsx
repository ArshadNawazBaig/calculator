import Link from 'next/link';
import {ChevronRight} from 'lucide-react';

export type BreadcrumbItem={label:string;href?:string};
type BreadcrumbsProps={items:BreadcrumbItem[];className?:string;tone?:'default'|'inverse'};

export function Breadcrumbs({items,className='',tone='default'}:BreadcrumbsProps){
  return <nav className={`breadcrumbs ${className}`} data-tone={tone} aria-label="Breadcrumb">
    <ol>
      <li><Link href="/">Home</Link></li>
      {items.map((item,i)=><li key={i}>
        <ChevronRight size={13} aria-hidden="true"/>
        {item.href?<Link href={item.href}>{item.label}</Link>:<span aria-current="page">{item.label}</span>}
      </li>)}
    </ol>
  </nav>;
}
