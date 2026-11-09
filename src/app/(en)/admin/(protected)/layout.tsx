import {PenLine} from 'lucide-react';
import {redirect} from 'next/navigation';
import {getSuperAdminSession} from '@/lib/server/auth';
import {AdminNavigation} from '@/components/admin/admin-navigation';
import styles from '@/components/admin/admin.module.css';

export default async function ProtectedAdminLayout({children}: {children: React.ReactNode}) {
  const session = await getSuperAdminSession();
  if (!session) redirect('/admin/sign-in');
  return <div className={styles.shell}>
    <header className={styles.top}>
      <div className={styles.account}>
        <span className={styles.accountIcon}><PenLine size={18} aria-hidden="true"/></span>
        <div><p className={styles.eyebrow}>Finflo publishing</p><p className={styles.muted}>Signed in as {session.user.name}</p></div>
      </div>
      <AdminNavigation/>
    </header>
    {children}
  </div>;
}
