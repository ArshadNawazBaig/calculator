import Link from '@/components/document-link';
import {GraduationCap} from 'lucide-react';
import {Icon} from '@/components/ui/icon';
import {catalog} from '@/lib/calculators/registry';
import {categories} from '@/lib/site';
import {studentDirectory, studentTools} from '@/lib/student-tools';
import {spinWheels} from '@/lib/spin-wheels/catalog';
import {timeTools} from '@/lib/time/tools';
import {localizedPath, translator, type Dictionary, type Locale} from '@/lib/i18n/config';
import styles from './category-navigation.module.css';

const links = [
  {href: studentDirectory.path, label: 'Student tools', icon: 'students', count: studentTools.length},
  ...categories.map(category => ({href: `/calculators/${category.id}`, label: category.name, icon: category.icon, count: catalog.filter(tool => tool.category === category.id).length})),
  {href: '/time', label: 'Time & clocks', icon: 'time', count: timeTools.length},
  {href: '/spin-wheels', label: 'Spin wheels', icon: 'spin-wheels', count: spinWheels.length},
];

export function CategoryNavigation({currentPath = '/calculators', locale = 'en', messages = {}}: {currentPath?: string; locale?: Locale; messages?: Dictionary}) {
  const t = translator(messages);
  return <nav className={styles.navigation} aria-label={t('Browse by category')} data-category-navigation>
    <ul className={styles.list}>{links.map(link => <li key={link.href}>
      <Link className={styles.link} href={localizedPath(link.href, locale)} aria-current={currentPath === link.href ? 'page' : undefined}>
        {link.icon === 'students' ? <GraduationCap size={18} aria-hidden="true"/> : <Icon name={link.icon} size={18}/>}
        <span className={styles.label}>{t(link.label)}</span>
        <span className={styles.count}>{link.count}</span>
      </Link>
    </li>)}</ul>
  </nav>;
}
