'use client';

import {ArrowRight} from 'lucide-react';
import {useI18n} from '@/components/i18n/provider';
import Link from '@/components/i18n/link';
import {CalculatorCard} from '@/components/calculators/calculator-card';
import {featuredTools} from '@/lib/home-content';
import styles from './not-found-content.module.css';

export function NotFoundContent() {
  const {t} = useI18n();

  return <section className={styles.page} data-system-page aria-labelledby="page-title">
    <div className={styles.content}>
      <p className={styles.code}>404</p>
      <h1 id="page-title" className={styles.title}>{t('Page not found.')}</h1>
      <p className={styles.description}>{t('This page may have moved. Browse the directory to find a calculator.')}</p>
      <div className={styles.actions}>
        <Link className="button button-primary" href="/calculators">
          {t('Browse calculators')}<ArrowRight size={18} aria-hidden="true"/>
        </Link>
        <Link className="button button-secondary" href="/">{t('Go home')}</Link>
      </div>
    </div>
    <section className={styles.popular} aria-labelledby="popular-calculators-title">
      <h2 id="popular-calculators-title">{t('Popular calculators')}</h2>
      <div className={styles.grid}>
        {featuredTools.all.map(tool => <CalculatorCard key={tool.slug} tool={{...tool, favorite: false}} size="compact"/>)}
      </div>
    </section>
  </section>;
}
