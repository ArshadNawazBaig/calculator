import {expect, test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
import {locales, localizedPath} from '../../src/lib/i18n/config';

for (const locale of locales) test(`${locale} FAQ page publishes localized questions, metadata and navigation`, async ({page}) => {
  const copy = JSON.parse(await readFile(`src/data/faq/${locale}.json`, 'utf8'));
  const path = localizedPath('/faq', locale);
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', {level: 1})).toHaveText(copy.title);
  await expect(page).toHaveTitle(copy.seoTitle.replace(/\s*\|\s*Finflo\s*$/i, ''));
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://finflo.org${path}`);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(9);
  await expect(page.locator('[data-faq-page] details')).toHaveCount(30);
  const first = page.locator('[data-faq-page] details').first();
  await first.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('open', '');
  await expect(first.locator('p').first()).toHaveText(copy.groups[0].questions[0].answer);
  await page.getByRole('navigation', {name: copy.topicsLabel}).getByRole('link').last().click();
  await expect(page).toHaveURL(new RegExp(`#${copy.groups.at(-1).id}$`));
  await expect(page.locator(`footer a[href="${path}"]`)).toHaveCount(1);
});

test('FAQ answers and accordions work without JavaScript', async ({browser, baseURL}) => {
  const context = await browser.newContext({javaScriptEnabled: false, baseURL});
  try {
    const page = await context.newPage();
    await page.goto('/faq');
    const first = page.locator('[data-faq-page] details').first();
    await first.locator('summary').click();
    await expect(first.locator('p').first()).toBeVisible();
    await expect(page.locator('[data-faq-page] details')).toHaveCount(30);
  } finally {await context.close();}
});

test('homepages and the sitemap lead to the localized FAQ page', async ({page}) => {
  for (const locale of ['en', 'es', 'ar'] as const) {
    const faqPath = localizedPath('/faq', locale);
    await page.goto(localizedPath('/', locale));
    await page.locator(`main a[href="${faqPath}"]`).click();
    await expect(page).toHaveURL(faqPath);
    await expect(page.locator('[data-faq-page]')).toBeVisible();
    await page.goto(localizedPath('/sitemap', locale));
    await expect(page.locator(`[data-sitemap-index] a[href="${faqPath}"]`)).toBeVisible();
  }
});

for (const [locale, theme] of [['en', 'light'], ['ar', 'dark']] as const) test(`${locale} FAQ fits mobile and passes accessibility checks in ${theme} mode`, async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.addInitScript(theme => localStorage.setItem('finflo.theme.v1', theme), theme);
  await page.goto(localizedPath('/faq', locale));
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await page.locator('[data-faq-page] details').first().locator('summary').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
});
