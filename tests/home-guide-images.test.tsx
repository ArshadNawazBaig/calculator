import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {renderToStaticMarkup} from 'react-dom/server';
import sharp from 'sharp';
import {describe, expect, it} from 'vitest';
import {LearningGuides} from '@/components/home/learning-guides';
import {LanguageProvider} from '@/components/i18n/provider';
import {homeGuideImages} from '@/data/home-guide-images';
import {getContentDictionary} from '@/lib/i18n/content';
import {locales, localizedPath, translator} from '@/lib/i18n/config';

const featuredSlugs = ['understanding-mortgage-payments', 'compound-interest-and-contributions', 'bmi-as-a-screening-tool'] as const;
const escapeAttribute = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

describe('original homepage guide images', () => {
  it('ships three distinct, decodable pictures with matching intrinsic dimensions', async () => {
    expect(Object.keys(homeGuideImages).sort()).toEqual([...featuredSlugs].sort());
    expect(new Set(Object.values(homeGuideImages).map(image => image.src)).size).toBe(3);
    await Promise.all(Object.values(homeGuideImages).map(async image => {
      expect(image.src).toMatch(/^\/home-images\/[^/]+\.webp$/);
      expect(image.alt.length).toBeGreaterThan(30);
      const bytes = await readFile(resolve('public', image.src.slice(1)));
      const decoded = sharp(bytes);
      const metadata = await decoded.metadata();
      expect(metadata.format, image.src).toBe('webp');
      expect(metadata.width, image.src).toBe(image.width);
      expect(metadata.height, image.src).toBe(image.height);
      expect(image.width / image.height).toBe(3 / 2);
      const stats = await decoded.stats();
      expect(stats.channels.some(channel => channel.min !== channel.max), image.src).toBe(true);
    }));
  });

  it.each(locales)('server-renders all three descriptive alternatives and guide links in %s', async locale => {
    const messages = await getContentDictionary(locale);
    const t = translator(messages);
    const html = renderToStaticMarkup(<LanguageProvider locale={locale} messages={messages}><LearningGuides messages={messages}/></LanguageProvider>);
    const cards = html.match(/<article\b[\s\S]*?<\/article>/g) || [];
    expect(cards).toHaveLength(3);
    expect(html.match(/<img\b/g)).toHaveLength(3);
    for (const slug of featuredSlugs) {
      const asset = homeGuideImages[slug];
      const href = localizedPath(`/guides/${slug}`, locale);
      const card = cards.find(article => article.includes(`href="${href}"`));
      expect(card, `${locale}: ${slug}`).toBeDefined();
      const image = card!.match(/<img\b[^>]*>/g) || [];
      expect(image).toHaveLength(1);
      const markup = image[0]!;
      const alt = t(asset.alt);
      expect(alt.trim()).toBeTruthy();
      if (locale !== 'en') {
        expect(messages[asset.alt], `${locale}: ${asset.alt}`).toBe(alt);
        expect(alt).not.toBe(asset.alt);
      }
      expect(markup).toContain(`alt="${escapeAttribute(alt)}"`);
      expect(markup).not.toContain('aria-hidden="true"');
      expect(markup).toContain(`width="${asset.width}"`);
      expect(markup).toContain(`height="${asset.height}"`);
      expect(markup).toContain('loading="lazy"');
      const source = new URL(markup.match(/\bsrc="([^"]+)"/)![1].replace(/&amp;/g, '&'), 'https://finflo.org');
      expect(source.pathname === '/_next/image' ? source.searchParams.get('url') : source.pathname).toBe(asset.src);
      expect(card).toMatch(new RegExp(`<h3><a[^>]+href="${href}"`));
    }
  });
});
