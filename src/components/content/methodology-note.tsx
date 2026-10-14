import {BookOpen, ChevronRight} from 'lucide-react';
import Link from '@/components/i18n/link';
import {translator, type Dictionary} from '@/lib/i18n/config';

export function MethodologyNote({messages = {}}: {messages?: Dictionary}) {
  const t = translator(messages);
  return <div className="aside-note" data-theme-surface="dark">
    <BookOpen size={28} aria-hidden="true"/>
    <h3>{t('Know the why.')}</h3>
    <p>{t('Every useful result starts with clear assumptions. Explore the formula before making a decision.')}</p>
    <Link className="button button-primary" href="/methodology"><span>{t('Our methodology')}</span><ChevronRight size={16} aria-hidden="true"/></Link>
  </div>;
}
