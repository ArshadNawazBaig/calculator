'use client';
import {useI18n} from './provider';
import Link from './link';
import {PageHero} from '@/components/content/page-hero';
export function LocalizedNotFound() {
  const {t} = useI18n();
  return <PageHero variant="system" showBreadcrumbs={false} eyebrow="404" title={t('Page not found.')} description={t('This page may have moved. Browse the directory to find a calculator.')}>
    <Link className="button button-primary" href="/calculators">{t('Browse calculators')}</Link><Link className="button button-ghost" href="/">{t('Go home')}</Link>
  </PageHero>;
}
