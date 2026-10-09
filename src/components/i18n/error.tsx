'use client';
import {useI18n} from './provider';
import Link from './link';
import {PageHero} from '@/components/content/page-hero';
import {Button} from '@/components/ui/button';
export function LocalizedError({retry}: {error: Error & {digest?: string}; retry: () => void}) {
  const {t} = useI18n();
  return <PageHero variant="system" showBreadcrumbs={false} eyebrow="FINFLO" title={t('Something didn’t add up.')} description={t('This page hit an unexpected problem. Try loading it again, or return to the calculator directory.')}>
    <Button onClick={retry}>{t('Try again')}</Button><Link className="button button-secondary" href="/calculators">{t('Browse calculators')}</Link>
  </PageHero>;
}
