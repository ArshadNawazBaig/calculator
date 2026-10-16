import Link from 'next/link';
import {Accordion,AccordionItem} from '@/components/ui/accordion';
import {information} from '@/data/information';
import {guides} from '@/data/guides';
import {catalog} from '@/lib/calculators/registry';
import {categorySlug} from '@/lib/catalog-paths';
import {categories} from '@/lib/site';
import {translator, localizedPath, type Dictionary, type Locale} from '@/lib/i18n/config';
import styles from './explanation.module.css';

export function SitemapIndex({locale='en',messages={}}: {locale?:Locale;messages?:Dictionary}) {
  const t=translator(messages);
  return <section className={styles.panel} data-sitemap-index>
    <h2>{t('Sitemap')}</h2>
    <nav aria-label={t('Sitemap')}>
      <ul className={styles.sitemapLinks}>{[['/','Home'],['/calculators','All calculators'],['/calculators/students','Student tools'],['/guides','Guides'],['/faq','FAQs'],['/spin-wheels','Spin wheels'],['/time','Time & clocks']].map(([path,label])=><li key={path}><Link href={localizedPath(path,locale)}>{t(label)}</Link></li>)}</ul>
      <h3>{t('All calculators')}</h3>
      <Accordion>{categories.map(category=><AccordionItem key={category.id} title={t(category.label)}><ul className={styles.sitemapLinks}>{[...new Set(catalog.filter(tool=>tool.category===category.id).map(tool=>tool.subcategory))].map(subcategory=><li key={subcategory}><Link href={localizedPath(`/calculators/${category.id}/${categorySlug(subcategory)}`,locale)}>{t(subcategory)}</Link></li>)}</ul></AccordionItem>)}</Accordion>
      <h3>{t('Guides')}</h3><ul className={styles.sitemapLinks}>{Object.entries(guides).map(([slug,guide])=><li key={slug}><Link href={localizedPath(`/guides/${slug}`,locale)}>{t(guide.title)}</Link></li>)}</ul>
      <h3>{t('About Finflo')}</h3><ul className={styles.sitemapLinks}>{Object.entries(information).map(([slug,page])=><li key={slug}><Link href={localizedPath(`/${slug}`,locale)}>{t(slug==='about'?'About Finflo':slug==='methodology'?'Our methodology':page.title)}</Link></li>)}</ul>
    </nav>
  </section>;
}
