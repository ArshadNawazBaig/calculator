import {publishedLocales} from '@/lib/i18n/config';
import {site} from '@/lib/site';

export function GET() {
  const xmlns = 'http://www.sitemaps.org/schemas/sitemap/0.9';
  const children = publishedLocales.map(locale =>
    `  <sitemap><loc>${new URL('/sitemap-' + locale + '.xml', site.url).href}</loc></sitemap>`
  );
  const xml = site.indexable
    ? `<sitemapindex xmlns="${xmlns}">\n${children.join('\n')}\n</sitemapindex>`
    : `<urlset xmlns="${xmlns}"/>`;
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${xml}\n`, {
    headers: {'Content-Type': 'application/xml; charset=utf-8'},
  });
}
