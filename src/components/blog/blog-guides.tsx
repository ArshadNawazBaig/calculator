import Link from '@/components/document-link';
import {guides} from '@/data/guides';
import styles from './blog.module.css';

export function BlogGuides({filtered=false}: {filtered?:boolean}) {
  return <><section className={styles.empty}>
    <h2>{filtered?'Explore another topic or a worked guide':'Put the ideas into practice'}</h2>
    <p>{filtered?'There are no published articles in this selection. Browse all topics, or use a calculation guide below.':'Explore our existing calculation guides for useful examples, assumptions and explanations you can apply to your own numbers.'}</p>
    {filtered&&<p><Link className="text-link" href="/blog">Browse all articles</Link></p>}
  </section><div className="guide-grid">{Object.entries(guides).map(([slug,guide])=><article className="guide-card" key={slug}><span className="eyebrow">CALCULATION GUIDE</span><h2><Link href={`/guides/${slug}`}>{guide.title}</Link></h2><p>{guide.description}</p><Link className="text-link" href={`/guides/${slug}`}>Read the guide</Link></article>)}</div></>;
}
