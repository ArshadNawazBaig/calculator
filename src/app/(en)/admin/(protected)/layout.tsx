import Link from '@/components/document-link';
import {redirect} from 'next/navigation';
import {getSuperAdminSession} from '@/lib/server/auth';
import {AdminSignOut} from '@/components/admin/auth-controls';
import styles from '@/components/admin/admin.module.css';

export default async function ProtectedAdminLayout({children}: {children: React.ReactNode}) {
  const session = await getSuperAdminSession();
  if (!session) redirect('/admin/sign-in');
  return <div className={styles.shell}><header className={styles.top}><div><p className={styles.eyebrow}>Finflo publishing</p><p className={styles.muted}>Signed in as {session.user.name}</p></div><nav className={styles.nav} aria-label="Blog administration"><Link href="/admin">Dashboard</Link><Link href="/admin/posts">All posts</Link><Link href="/blog">View blog</Link><AdminSignOut/></nav></header>{children}</div>;
}
