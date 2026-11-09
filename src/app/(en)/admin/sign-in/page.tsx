import Link from '@/components/document-link';
import {redirect} from 'next/navigation';
import {ArrowLeft, ShieldCheck} from 'lucide-react';
import {getSuperAdminSession, isAdminConfigured} from '@/lib/server/auth';
import {AdminSignIn} from '@/components/admin/auth-controls';
import {AdminPageHeader} from '@/components/admin/admin-page-header';
import styles from '@/components/admin/admin.module.css';

export default async function AdminSignInPage() {
  const configured = isAdminConfigured();
  let unavailable = false;
  let session = null;
  try {session = await getSuperAdminSession();}
  catch {unavailable = true;}
  if (session) redirect('/admin');
  return <div className={styles.shell}>
    <AdminPageHeader title="Super admin sign-in" description="Manage articles, review drafts and publish to the Finflo blog."/>
    <section className={`${styles.panel} ${styles.login}`} aria-label="Super admin sign-in form">
    <div className={styles.loginIntro}><ShieldCheck size={21} aria-hidden="true"/><p className={styles.muted}>Sign in with your super admin account to open the publishing dashboard.</p></div>
    {!configured ? <p className={styles.notice}>Blog administration is not configured yet. The site owner must connect the database and create the super admin account using the server setup instructions.</p> : unavailable ? <p role="alert" className={styles.error}>Sign-in is temporarily unavailable. Please try again shortly.</p> : <AdminSignIn/>}
    <p className={styles.loginFooter}><Link href="/blog"><ArrowLeft size={15} aria-hidden="true"/>Return to the blog</Link></p>
  </section></div>;
}
