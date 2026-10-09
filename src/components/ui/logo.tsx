"use client";
import {useI18n} from "@/components/i18n/provider";
import Link from '@/components/i18n/link';
import Image from 'next/image';
import styles from './logo.module.css';

export function Logo({ onDark = false }: { onDark?: boolean }) {
 const {t}=useI18n();

  return (
    <Link
      href="/"
      aria-label={t("Finflo home")}
      className={`logo cursor-pointer ${onDark ? styles.onDark : ''}`}
    >
      <Image
        className={styles.image}
        src="/finflo-logo.webp"
        width={626}
        height={212}
        alt="Finflo — Calculate, plan, grow"
        unoptimized
        loading="eager"
      />
    </Link>
  );
}
