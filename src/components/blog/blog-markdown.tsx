import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {remarkArticleBreaks} from '@/lib/blog/markdown-breaks';
import styles from './blog.module.css';

/** Strict destinations for both public articles and the administrator preview. */
export function blogContentUrl(value: string, image = false): string | undefined {
  const text = value.trim();
  if (!text || /[\u0000-\u0020\u007f\\]/.test(text) || text.startsWith('//')) return undefined;
  if (text.startsWith('/') || !image && text.startsWith('#')) return text;
  try {
    const url = new URL(text);
    if (url.username || url.password) return undefined;
    return (image ? url.protocol === 'https:' : ['https:','http:','mailto:'].includes(url.protocol)) ? text : undefined;
  } catch {return undefined;}
}

export function BlogMarkdown({content}: {content:string}) {
  return <div className={styles.markdown} data-blog-markdown>
    <Markdown remarkPlugins={[remarkGfm,remarkArticleBreaks]} skipHtml urlTransform={(url,key)=>blogContentUrl(url,key==='src')} components={{
      h1:({children})=><h2>{children}</h2>,
      a:({href,children,title})=>href?<a href={href} title={title} rel={/^https?:/i.test(href)?'noopener noreferrer':undefined}>{children}</a>:<span>{children}</span>,
      img:({src,alt,title})=>{
        const source=typeof src==='string'?blogContentUrl(src,true):undefined;
        // Informative images must retain a useful text alternative. Invalid
        // destinations are omitted rather than becoming tracking/broken images.
        if (!source || !alt?.trim()) return alt?<span>{alt}</span>:null;
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={source} alt={alt} title={title} loading="lazy" decoding="async" referrerPolicy="no-referrer"/>;
      },
      table:({children})=><div className={styles.tableScroll} role="region" aria-label="Article table" tabIndex={0}><table>{children}</table></div>,
    }}>{content}</Markdown>
  </div>;
}
