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
      className="logo cursor-pointer"
    >
      <Image
        className={styles.image}
        src="/finflo-logo.webp"
        width={568}
        height={167}
        alt="Finflo"
        unoptimized
        loading="eager"
      />
    </Link>
  );
}
