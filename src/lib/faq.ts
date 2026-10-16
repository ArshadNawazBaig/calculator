import type {Locale} from '@/lib/i18n/config';

export type FaqContent = {
  title: string;
  seoTitle: string;
  description: string;
  eyebrow: string;
  topicsLabel: string;
  homeLinkLabel: string;
  navLabel: string;
  contactTitle: string;
  contactText: string;
  contactLinkLabel: string;
  groups: {
    id: string;
    title: string;
    description: string;
    questions: {id: string; question: string; answer: string; link?: {href: string; label: string}}[];
  }[];
};

const content = {
  en: () => import('@/data/faq/en.json'),
  es: () => import('@/data/faq/es.json'),
  fr: () => import('@/data/faq/fr.json'),
  de: () => import('@/data/faq/de.json'),
  pt: () => import('@/data/faq/pt.json'),
  ar: () => import('@/data/faq/ar.json'),
  hi: () => import('@/data/faq/hi.json'),
  tl: () => import('@/data/faq/tl.json'),
};

export async function getFaqContent(locale: Locale): Promise<FaqContent> {
  return (await content[locale]()).default;
}
