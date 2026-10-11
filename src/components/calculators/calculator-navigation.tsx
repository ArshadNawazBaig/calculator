import {BookOpen, Calculator, ChartNoAxesColumn} from 'lucide-react';
import {translator, type Dictionary} from '@/lib/i18n/config';
import styles from './calculator-navigation.module.css';

export function CalculatorNavigation({messages = {}}: {messages?: Dictionary}) {
  const t = translator(messages);
  return <nav className={`${styles.nav} no-print`} aria-label={t('On this page')}>
    <a href="#calculator-inputs"><Calculator size={17} aria-hidden="true"/>{t('Your inputs')}</a>
    <a href="#calculation-summary"><ChartNoAxesColumn size={17} aria-hidden="true"/>{t('Results')}</a>
    <a href="#how-it-works"><BookOpen size={17} aria-hidden="true"/>{t('How it works')}</a>
  </nav>;
}
