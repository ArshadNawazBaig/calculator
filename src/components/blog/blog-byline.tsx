import Image from 'next/image';
import Link from '@/components/document-link';
import type {ReactNode} from 'react';
import {blogAuthor} from '@/lib/blog/author';
import {site} from '@/lib/site';
import styles from './blog.module.css';

export function BlogByline({authorName, children}: {authorName: string; children?: ReactNode}) {
  const author = blogAuthor(authorName);
  const dates = children && <span className={styles.bylineDates}>{children}</span>;

  if (!author.avatar) {
    return <div className={styles.byline}><span>By {author.name}</span>{dates && <> · {dates}</>}</div>;
  }
  return <div className={`${styles.byline} ${styles.authorProfile}`}>
    <Image className={styles.authorAvatar} src={author.avatar} width={60} height={60} alt="" loading="lazy"/>
    <div>
      <span className="sr-only">By </span><strong className={styles.authorName}>{author.profilePath ? <Link href={author.profilePath} rel="author">{author.name}</Link> : author.name}</strong>
      {author.jobTitle && <span className={styles.authorRole}>{author.jobTitle} at {site.name}</span>}
      {dates}
    </div>
  </div>;
}
