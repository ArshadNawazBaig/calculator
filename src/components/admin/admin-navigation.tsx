'use client';

import {usePathname} from 'next/navigation';
import Link from '@/components/document-link';
import {AdminSignOut} from './auth-controls';
import tabs from '@/components/ui/segmented-tabs.module.css';
import styles from './admin.module.css';

export function AdminNavigation() {
  const pathname = usePathname();
  return <div className={styles.navigation}>
    <nav aria-label="Blog administration" className={tabs.tabs}>
      <Link href="/admin" className={tabs.item} aria-current={pathname === '/admin' ? 'page' : undefined}>Dashboard</Link>
      <Link href="/admin/posts" className={tabs.item} aria-current={pathname.startsWith('/admin/posts') ? 'page' : undefined}>All posts</Link>
      <Link href="/blog" className={tabs.item}>View blog</Link>
    </nav>
    <AdminSignOut/>
  </div>;
}
