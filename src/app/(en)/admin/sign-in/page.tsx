import Link from '@/components/document-link';
import {redirect} from 'next/navigation';
import {getSuperAdminSession, isAdminConfigured} from '@/lib/server/auth';
import {AdminSignIn} from '@/components/admin/auth-controls';
import styles from '@/components/admin/admin.module.css';

export default async function AdminSignInPage() {
  const configured = isAdminConfigured();
  let unavailable = false;
  let session = null;
  try {session = await getSuperAdminSession();}
  catch {unavailable = true;}
  if (session) redirect('/admin');
  return <div className={styles.shell}><section className={`${styles.panel} ${styles.login}`} aria-labelledby="admin-sign-in-title">
    <p className={styles.eyebrow}>Finflo publishing</p><h1 id="admin-sign-in-title">Super admin sign-in</h1>
    <p className={styles.muted}>Manage articles, review drafts and publish to the Finflo blog.</p>
    {!configured ? <p className={styles.notice}>Blog administration is not configured yet. The site owner must connect the database and create the super admin account using the server setup instructions.</p> : unavailable ? <p role="alert" className={styles.error}>Sign-in is temporarily unavailable. Please try again shortly.</p> : <AdminSignIn/>}
    <p className={styles.muted}><Link href="/blog">Return to the blog</Link></p>
  </section></div>;
}
