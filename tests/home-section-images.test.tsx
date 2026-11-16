import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {renderToStaticMarkup} from 'react-dom/server';
import sharp from 'sharp';
import {describe, expect, it} from 'vitest';
import Home from '@/app/(en)/page';
import {LocalizedHome} from '@/components/i18n/localized-home';
import {LanguageProvider} from '@/components/i18n/provider';
import {WheelCollection} from '@/components/spin-wheels/wheel-collection';
import {TimeCollection} from '@/components/time/time-collection';
import {homeSectionImages} from '@/data/home-section-images';
import {getContentDictionary} from '@/lib/i18n/content';
import {locales, localizedPath, translator} from '@/lib/i18n/config';

const sections = {
  planning: {heading: 'planning-title', links: ['/house-affordability-calculator', '/mortgage-calculator']},
  finance: {heading: 'finance-tools-title', links: ['/calculators/finance', '/compound-interest-calculator']},
  health: {heading: 'health-tools-title', links: ['/calculators/health', '/calorie-calculator']},
  everyday: {heading: 'everyday-tools-title', links: ['/percent-calculator', '/conversion-calculator']},
  'spin-wheels': {heading: 'wheel-collection-title', links: ['/spin-wheels']},
  time: {heading: 'time-collection-title', links: ['/time']},
  'how-it-works': {heading: 'how-it-works-title', links: []},
  confidence: {heading: 'confidence-title', links: []},
  workspace: {heading: 'workspace-title', links: ['/workspace']},
} as const;
const escapeAttribute = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function imageSource(markup: string) {
  const src = markup.match(/\bsrc="([^"]+)"/)?.[1];
  expect(src).toBeTruthy();
  const url = new URL(src!.replace(/&amp;/g, '&'), 'https://finflo.org');
  return url.pathname === '/_next/image' ? url.searchParams.get('url') : url.pathname;
}

describe('original homepage section images', () => {
  it('ships distinct, nonempty WebP art with the declared intrinsic dimensions', async () => {
    expect(Object.keys(homeSectionImages).sort()).toEqual(Object.keys(sections).sort());
    expect(new Set(Object.values(homeSectionImages).map(image => image.src)).size).toBe(9);
    await Promise.all(Object.entries(homeSectionImages).map(async ([id, image]) => {
      expect(image.src).toBe(`/home-images/sections/${id}.webp`);
      expect(image.alt.length).toBeGreaterThan(30);
      const bytes = await readFile(resolve('public', image.src.slice(1)));
      const decoded = sharp(bytes);
      const metadata = await decoded.metadata();
      expect(metadata.format, id).toBe('webp');
      expect(metadata.width, id).toBe(image.width);
      expect(metadata.height, id).toBe(image.height);
      expect(image.width / image.height, id).toBe(3 / 2);
      const stats = await decoded.stats();
      expect(stats.channels.some(channel => channel.min !== channel.max), id).toBe(true);
    }));
  });

  it.each(locales)('includes every image with translated alt text in its actual %s homepage section', async locale => {
    const messages = await getContentDictionary(locale);
    const t = translator(messages);
    const html = renderToStaticMarkup(<LanguageProvider locale={locale} messages={messages}>{locale === 'en' ? <Home/> : <LocalizedHome messages={messages}/>}</LanguageProvider>);
    const allImages = (html.match(/<img\b[^>]*>/g) || []).map(imageSource);
    for (const [id, image] of Object.entries(homeSectionImages)) {
      const {heading, links} = sections[id as keyof typeof sections];
      const section = html.match(new RegExp(`<section\\b[^>]*aria-labelledby="${heading}"[^>]*>[\\s\\S]*?</section>`))?.[0];
      expect(section, `${locale}: ${id}`).toBeDefined();
      const markup = (section!.match(/<img\b[^>]*>/g) || []).find(imageMarkup => imageSource(imageMarkup) === image.src);
      expect(markup, `${locale}: ${id} is missing from its section`).toBeDefined();
      expect(allImages.filter(src => src === image.src), `${locale}: ${id}`).toHaveLength(1);
      const alt = t(image.alt);
      if (locale !== 'en') {
        expect(messages[image.alt], `${locale}: ${image.alt}`).toBe(alt);
        expect(alt).not.toBe(image.alt);
      }
      expect(markup).toContain(`alt="${escapeAttribute(alt)}"`);
      expect(markup).not.toContain('aria-hidden="true"');
      expect(markup).toContain(`width="${image.width}"`);
      expect(markup).toContain(`height="${image.height}"`);
      expect(markup).toContain('loading="lazy"');
      for (const href of links) expect(section).toContain(`href="${localizedPath(href, locale)}"`);
    }
  }, 20_000);

  it('keeps homepage art out of the standalone time and spin-wheel directories', () => {
    for (const collection of [<TimeCollection key="time"/>, <WheelCollection key="wheels"/>]) {
      const html = renderToStaticMarkup(collection);
      const sources = (html.match(/<img\b[^>]*>/g) || []).map(imageSource);
      expect(sources.some(src => src?.startsWith('/home-images/sections/'))).toBe(false);
    }
  });
});
