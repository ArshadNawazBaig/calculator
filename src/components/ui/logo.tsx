"use client";
import {useI18n} from "@/components/i18n/provider";
import Link from '@/components/i18n/link';
import Image from 'next/image';
import styles from './logo.module.css';

export function Logo() {
 const {t}=useI18n();

  return (
    <Link
      href="/"
      aria-label={t("Finflo home")}
      className={`logo cursor-pointer ${styles.logo}`}
    >
      <Image
        className={`${styles.image} ${styles.light}`}
        src="/finflo-logo-light.webp"
        width={576}
        height={175}
        alt="Finflo"
        unoptimized
        fetchPriority="high"
      />
      <Image
        className={`${styles.image} ${styles.dark}`}
        src="/finflo-logo-dark.webp"
        width={576}
        height={175}
        alt="Finflo"
        unoptimized
        fetchPriority="high"
      />
    </Link>
  );
}
