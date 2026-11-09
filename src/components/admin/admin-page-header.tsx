import type {ReactNode} from 'react';
import {PageHero} from '@/components/content/page-hero';
import styles from './admin.module.css';

export function AdminPageHeader({title, description, eyebrow = 'Finflo publishing', children}: {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return <div className={styles.pageHeader}><PageHero eyebrow={eyebrow} title={title} description={description} showBreadcrumbs={false}>{children}</PageHero></div>;
}
