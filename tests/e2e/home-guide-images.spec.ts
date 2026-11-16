import {readFile} from 'node:fs/promises';
import {expect, test, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {homeGuideImages} from '../../src/data/home-guide-images';
import {localizedPath, translator, type Locale} from '../../src/lib/i18n/config';

async function expectGuideImages(page: Page, locale: Locale) {
  const messages = locale === 'en' ? {} : {
    ...JSON.parse(await readFile(`src/data/locales/content/${locale}.json`, 'utf8')),
    ...JSON.parse(await readFile(`src/data/locales/${locale}.json`, 'utf8')),
  };
  const t = translator(messages);
  const section = page.locator('section[aria-labelledby="guides-title"]');
  await expect(section.getByRole('img')).toHaveCount(3);
  for (const [slug, asset] of Object.entries(homeGuideImages)) {
    const href = localizedPath(`/guides/${slug}`, locale);
    const card = section.locator('article').filter({has: page.locator(`h3 a[href="${href}"]`)});
    await expect(card).toHaveCount(1);
    const image = card.getByRole('img');
    await expect(image).toHaveAccessibleName(t(asset.alt));
    await image.scrollIntoViewIfNeeded();
    const source = new URL((await image.getAttribute('src'))!, page.url());
    expect(source.pathname === '/_next/image' ? source.searchParams.get('url') : source.pathname).toBe(asset.src);
    await expect(image).toHaveAttribute('width', String(asset.width));
    await expect(image).toHaveAttribute('height', String(asset.height));
    await expect.poll(() => image.evaluate(element => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0)).toBe(true);
    const dimensions = await image.evaluate(element => {
      const image = element as HTMLImageElement;
      const rectangle = image.getBoundingClientRect();
      return {naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, width: rectangle.width, height: rectangle.height};
    });
    expect(dimensions.naturalWidth / dimensions.naturalHeight).toBeCloseTo(asset.width / asset.height, 2);
    expect(dimensions.width / dimensions.height).toBeCloseTo(asset.width / asset.height, 2);
    await expect(card.locator(`a[href="${href}"]`).last()).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  return section;
}

test.beforeEach(async ({page}) => {
  await page.route('https://pagead2.googlesyndication.com/**', route => route.abort());
});

test.describe('homepage guide images without JavaScript', () => {
  test.use({javaScriptEnabled: false});

  test('serves all three images and working guide links in the initial desktop document', async ({page}) => {
    await page.goto('/', {waitUntil: 'domcontentloaded'});
    const section = await expectGuideImages(page, 'en');
    await section.locator('h3 a[href="/guides/understanding-mortgage-payments"]').click();
    await expect(page).toHaveURL(/\/guides\/understanding-mortgage-payments$/);
    await expect(page.locator('h1')).toBeVisible();
  });
});

test('Arabic guide images stay accessible and fit a narrow RTL screen', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/ar', {waitUntil: 'domcontentloaded'});
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expectGuideImages(page, 'ar');
  const accessibility = await new AxeBuilder({page}).include('section[aria-labelledby="guides-title"]').analyze();
  expect(accessibility.violations).toEqual([]);
  expect(errors).toEqual([]);
});
