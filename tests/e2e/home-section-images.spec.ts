import {readFile} from 'node:fs/promises';
import {test, expect, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {homeSectionImages} from '../../src/data/home-section-images';
import {translator, type Locale} from '../../src/lib/i18n/config';

const headings = {
  planning: 'planning-title', finance: 'finance-tools-title', health: 'health-tools-title',
  everyday: 'everyday-tools-title', 'spin-wheels': 'wheel-collection-title', time: 'time-collection-title',
  'how-it-works': 'how-it-works-title', confidence: 'confidence-title', workspace: 'workspace-title',
} as const;

async function expectSectionImages(page: Page, locale: Locale) {
  const messages = locale === 'en' ? {} : {
    ...JSON.parse(await readFile(`src/data/locales/content/${locale}.json`, 'utf8')),
    ...JSON.parse(await readFile(`src/data/locales/${locale}.json`, 'utf8')),
  };
  const t = translator(messages);
  for (const [id, asset] of Object.entries(homeSectionImages)) {
    const section = page.locator(`section[aria-labelledby="${headings[id as keyof typeof headings]}"]`);
    const image = section.getByRole('img');
    await expect(image).toHaveCount(1);
    await expect(image).toHaveAccessibleName(t(asset.alt));
    await expect(image).toHaveAttribute('width', String(asset.width));
    await expect(image).toHaveAttribute('height', String(asset.height));
    const source = new URL((await image.getAttribute('src'))!, page.url());
    expect(source.pathname === '/_next/image' ? source.searchParams.get('url') : source.pathname).toBe(asset.src);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(element => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0)).toBe(true);
    const dimensions = await image.evaluate(element => {
      const image = element as HTMLImageElement;
      const rectangle = image.getBoundingClientRect();
      const media = image.parentElement!;
      return {naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, width: rectangle.width, height: rectangle.height, mediaWidth: media.clientWidth, mediaHeight: media.clientHeight, fit: getComputedStyle(image).objectFit};
    });
    // The browser rounds density-corrected intrinsic dimensions to whole pixels.
    expect(Math.abs(dimensions.naturalHeight - dimensions.naturalWidth * asset.height / asset.width), id).toBeLessThanOrEqual(1);
    // Artwork fills its complete media panel without stretching or empty bands.
    expect(dimensions.fit, id).toBe('cover');
    expect(Math.abs(dimensions.width - dimensions.mediaWidth), id).toBeLessThanOrEqual(1);
    expect(Math.abs(dimensions.height - dimensions.mediaHeight), id).toBeLessThanOrEqual(1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

test.beforeEach(async ({page}) => {
  await page.route('https://pagead2.googlesyndication.com/**', route => route.abort());
});

test.describe('homepage section images without JavaScript', () => {
  test.use({javaScriptEnabled: false, colorScheme: 'light'});

  test('loads all nine images and preserves calculator navigation on desktop', async ({page}) => {
    await page.goto('/', {waitUntil: 'domcontentloaded'});
    await expectSectionImages(page, 'en');
    await page.locator('section[aria-labelledby="finance-tools-title"] a[href="/compound-interest-calculator"]').click();
    await expect(page).toHaveURL(/\/compound-interest-calculator$/);
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('homepage section images on a narrow RTL screen', () => {
  test.use({viewport: {width: 320, height: 800}, colorScheme: 'dark'});

  test('loads localized alternatives and retains accessible sections in dark mode', async ({page}) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/ar', {waitUntil: 'domcontentloaded'});
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expectSectionImages(page, 'ar');
    let accessibility = new AxeBuilder({page});
    for (const heading of Object.values(headings)) accessibility = accessibility.include(`section[aria-labelledby="${heading}"]`);
    expect((await accessibility.analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
  });
});
