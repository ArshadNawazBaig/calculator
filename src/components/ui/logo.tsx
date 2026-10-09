import Link from 'next/link';
import Image from 'next/image';
import styles from './logo.module.css';

export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Finflo home"
      className={`logo cursor-pointer ${onDark ? styles.onDark : ''}`}
    >
      <Image
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
