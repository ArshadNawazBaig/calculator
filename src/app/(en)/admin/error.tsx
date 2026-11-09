'use client';

import Link from '@/components/document-link';
import {Button} from '@/components/ui/button';
import {AdminPageHeader} from '@/components/admin/admin-page-header';
import styles from '@/components/admin/admin.module.css';
export default function AdminError({reset}: {reset: () => void}) {
  return <div className={styles.shell}>
    <AdminPageHeader title="Administration is temporarily unavailable" description="Your saved articles remain in the database. Please try again shortly.">
      <Button type="button" onClick={reset}>Try again</Button>
      <Link className="button button-secondary" href="/admin/sign-in">Return to sign-in</Link>
    </AdminPageHeader>
  </div>;
}
