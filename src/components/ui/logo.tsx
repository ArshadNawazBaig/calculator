"use client";
import {useI18n} from "@/components/i18n/provider";
import Link from '@/components/i18n/link';
import Image from 'next/image';
import styles from './logo.module.css';

const logoSizes = '(max-width: 360px) 80px, (max-width: 1000px) 116px, 128px';

export function Logo({loading = 'lazy'}: {loading?: 'lazy' | 'eager'}) {
 const {t}=useI18n();

  return (
    <Link
      href="/"
      aria-label={t("Finflo home")}
      className={`logo cursor-pointer ${styles.logo}`}
    >
      <picture>
        <source media="print" srcSet="/finflo-logo-light.webp"/>
        <Image
          className={styles.image}
          src="/finflo-logo-dark.webp"
          width={576}
          height={175}
          alt="Finflo"
          sizes={logoSizes}
          loading={loading}
        />
      </picture>
    </Link>
  );
}
