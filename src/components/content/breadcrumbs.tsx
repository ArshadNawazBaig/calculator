"use client";
import {useI18n} from "@/components/i18n/provider";
import Link from '@/components/i18n/link';
import {ChevronRight} from 'lucide-react';

export type BreadcrumbItem={label:string;href?:string};
type BreadcrumbsProps={items:BreadcrumbItem[];className?:string;tone?:'default'|'inverse'};

export function Breadcrumbs({items,className='',tone='default'}:BreadcrumbsProps){
 const {t}=useI18n();

  return <nav className={`breadcrumbs ${className}`} data-tone={tone} aria-label="Breadcrumb">
    <ol>
      <li><Link href="/">{t("Home")}</Link></li>
      {items.map((item,i)=><li key={i}>
        <ChevronRight size={13} aria-hidden="true"/>
        {item.href?<Link href={item.href}>{t(item.label)}</Link>:<span aria-current="page">{t(item.label)}</span>}
      </li>)}
    </ol>
  </nav>;
}
