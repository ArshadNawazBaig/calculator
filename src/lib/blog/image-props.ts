import {site} from '@/lib/site';

const siteOrigin = new URL(site.url).origin;

/** Article authors supply URLs. Keep the original src for copying and indexing. */
export function blogImageProps(src: string) {
  const url = new URL(src, siteOrigin);
  // External hosts serve their own media. A query or fragment can select a specific rendition.
  const optimize = url.origin === siteOrigin && !url.pathname.startsWith('//') && !url.search && !url.hash;
  return {
    src: optimize ? url.pathname : src,
    overrideSrc: src,
    unoptimized: !optimize,
    loading: 'lazy',
    referrerPolicy: 'no-referrer',
    width: 736,
    height: 414,
    sizes: '(max-width: 48rem) calc(100vw - 36px), 46rem',
  } as const;
}
