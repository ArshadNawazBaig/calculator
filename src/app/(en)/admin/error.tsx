'use client';

import Link from '@/components/document-link';
import styles from '@/components/admin/admin.module.css';
export default function AdminError({reset}: {reset: () => void}) {return <div className={styles.shell}><section className={styles.panel}><h1>Administration is temporarily unavailable</h1><p>Your saved articles remain in the database. Please try again shortly.</p><button type="button" className="button button-primary" onClick={reset}>Try again</button> <Link href="/admin/sign-in">Return to sign-in</Link></section></div>;}
