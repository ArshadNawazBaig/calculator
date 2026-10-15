'use client';

import Link from '@/components/i18n/link';
import {useI18n} from '@/components/i18n/provider';
import {PageHero} from './page-hero';

export function SystemPage({code,title,description,children}:{code:string;title:string;description:string;children?:React.ReactNode}){
  const {t} = useI18n();
  return <PageHero variant="system" showBreadcrumbs={code!=='404'} eyebrow={code==='404'?'ERROR 404':`FINFLO · ${code}`} title={title} description={description}>
    {children}
    <Link className={`button ${children?'button-secondary':'button-primary'}`} href="/calculators">{t('Browse calculators')}</Link>
    <Link className="button button-ghost" href="/">{t('Go home')}</Link>
  </PageHero>;
}
