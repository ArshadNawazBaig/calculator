import {existsSync, readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe, expect, it, vi} from 'vitest';
import sharp from 'sharp';
import catalog from '@/data/catalog.json';
import manifest from '@/data/calculator-visuals.json';
import illustrations from '@/data/illustrations.json';
import symbolGroups from '../scripts/illustrations/sources/calculator-symbols.json';
import {calculatorIcons} from '@/lib/calculator-icons';
import {calculatorVisual} from '@/lib/calculator-visual';
import {getDictionary} from '@/lib/i18n/dictionaries';
import {locales} from '@/lib/i18n/config';
import {pageMetadata, socialImage} from '@/lib/metadata';
import {site} from '@/lib/site';
import sitemap from '@/app/sitemap';

vi.mock('@/lib/server/blog', () => ({getPublishedPostSitemapEntries: async () => []}));

describe('calculator illustrations and discovery', () => {
  it('provides an image, share image and localized description for every remaining calculator', async () => {
    const tools = catalog.filter(tool => tool.slug !== 'pregnancy-calculator');
    expect(Object.keys(manifest)).toHaveLength(tools.length);
    const artwork = new Set(tools.map(tool => createHash('sha256').update(readFileSync(`public/illustrations/calculators/${tool.slug}.webp`)).digest('hex')));
    expect(artwork.size).toBe(tools.length);
    const descriptions = new Map(Object.entries(symbolGroups).flatMap(([description, names]) => names.map(name => [name, description])));
    const dictionaries = Object.fromEntries(await Promise.all(locales.map(async locale => [locale, await getDictionary(locale)] as const)));
    for (const tool of tools) {
      const entry = manifest[tool.slug as keyof typeof manifest];
      expect(entry, tool.slug).toBeDefined();
      expect(entry.symbol, tool.slug).toBe(descriptions.get(calculatorIcons[tool.slug]?.displayName || ''));
      for (const locale of locales) {
        const title = locale === 'en' ? tool.title : dictionaries[locale]['tool.' + tool.slug];
        expect(title, `${locale}/${tool.slug}`).toBeTruthy();
        const visual = calculatorVisual(tool.slug, locale, title)!;
        expect(visual?.alt, `${locale}/${tool.slug}`).toContain(title);
        expect(visual.alt).not.toMatch(/\{(?:symbol|motif|tool)\}|undefined/);
        if (locale === 'en' && !entry.repeatedSymbol) expect(visual.alt).toContain(entry.symbol);
        if (locale === 'en') {
          expect(existsSync('public' + visual.src), tool.slug).toBe(true);
          expect(existsSync('public' + visual.socialSrc), tool.slug).toBe(true);
        }
      }
    }
  });

  it('describes the pictured symbols and serves correctly sized images', async () => {
    expect(calculatorVisual('age-calculator', 'en', 'Age Calculator')?.alt).toBe('Illustration for Age Calculator: a birthday cake; a calendar and clock.');
    expect(calculatorVisual('mortgage-calculator', 'en', 'Mortgage Calculator')?.alt).toBe('Illustration for Mortgage Calculator: a house and calculator.');
    expect(calculatorVisual('area-calculator', 'es', 'Área')?.alt).toContain('un cuadrado discontinuo; un triángulo y una regla');
    expect(calculatorVisual('bmi-calculator', 'ar', 'مؤشر كتلة الجسم')?.alt).toContain('ميزان ذو كفتين');
    expect(calculatorVisual('volume-calculator', 'en', 'Volume Calculator')?.alt).toBe('Illustration for Volume Calculator: a rectangular prism; a triangle and ruler.');
    for (const slug of ['age-calculator', 'mortgage-calculator', 'area-calculator', 'bmi-calculator', 'volume-calculator']) {
      const visual = calculatorVisual(slug, 'en', slug)!;
      for (const path of [visual.src, visual.socialSrc]) {
        const image = await sharp('public' + path).metadata();
        expect([image.width, image.height]).toEqual([1200, 630]);
      }
    }
  });

  it('uses the geometry cover’s tile positions and colors for the volume illustrations and share preview', async () => {
    const reference = calculatorVisual('area-calculator', 'en', 'Area Calculator')!;
    const cover = calculatorVisual('volume-calculator', 'en', 'Volume Calculator')!;
    const sources = [cover.src, cover.socialSrc, illustrations['solid-tank-waterline'].src,
      illustrations['solid-tapered-planter'].src, illustrations['solid-pipe-section'].src];
    const pixels = (path: string) => sharp('public' + path).resize(240, 126).removeAlpha().raw().toBuffer();
    const expected = await pixels(reference.src);
    // Compare the background, three tile interiors, and lime dot away from the variable artwork.
    const points = [[4, 8], [28, 33], [151, 43], [176, 88], [133, 24]];
    for (const path of sources) {
      const actual = await pixels(path);
      for (const [x, y] of points) {
        const start = (y * 240 + x) * 3;
        for (let index = start; index < start + 3; index++) {
          expect(Math.abs(actual[index] - expected[index]), `${path} at ${x},${y}`).toBeLessThan(12);
        }
      }
    }
  });

  it('keeps share images page-specific and includes the displayed images in the sitemap', async () => {
    const metadata = pageMetadata('Age Calculator', 'Description', '/age-calculator', true, 'en', 'Age Calculator');
    expect(metadata.openGraph?.images).toEqual([{url: site.url + '/illustrations/calculators/age-calculator-social.jpg', width: 1200, height: 630, alt: calculatorVisual('age-calculator', 'en', 'Age Calculator')!.alt}]);
    expect(pageMetadata('About', 'Description', '/about').openGraph?.images).toEqual([socialImage]);

    const wasIndexable = site.indexable;
    try {
      site.indexable = true;
      const entries = await sitemap();
      for (const [path, image] of [
        ['/age-calculator', '/illustrations/calculators/age-calculator.webp'],
        ['/ar/bmi-calculator', '/illustrations/calculators/bmi-calculator.webp'],
        ['/real-estate-calculator', '/illustrations/calculators/real-estate-calculator.webp'],
        ['/pregnancy-calculator', '/illustrations/pregnancy/pregnancy-dating.webp'],
      ]) expect(entries.find(entry => entry.url === site.url + path)?.images).toEqual([site.url + image]);
      expect(entries.find(entry => entry.url === site.url + '/about')?.images).toBeUndefined();
    } finally {
      site.indexable = wasIndexable;
    }
  });
});
