import {expect, test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
import {translator,isPublishedLocale,splitLocale} from '../../src/lib/i18n/config';

for (const path of ['/404', '/missing-calculator', '/missing/deep/page', '/calculators/missing', '/calculators/finance/missing', '/guides/missing', '/spin-wheels/missing', '/time/missing']) {
  test(`${path} returns a branded 404 instead of the framework fallback`, async ({page}) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle('Page not found | Finflo');
    await expect(page.getByRole('heading', {level: 1})).toHaveText('Page not found.');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('[data-system-page]')).toBeVisible();
    await expect(page.locator('[data-system-page] [data-calculator-card]')).toHaveCount(4);
    await expect(page.getByRole('heading', {level: 2, name: 'Popular calculators'})).toBeVisible();
    await expect(page.locator('[data-system-page]').getByRole('link', {name: 'Browse calculators'})).toHaveAttribute('href', '/calculators');
    await expect(page.locator('[data-system-page]').getByRole('link', {name: 'Go home'})).toHaveAttribute('href', '/');
    expect(await page.locator('meta[name="robots"]').evaluateAll(nodes => nodes.some(node => /noindex/.test(node.getAttribute('content') || '')))).toBe(true);
    expect(errors).toEqual([]);
  });
}

for (const locale of ['es', 'fr', 'de', 'pt', 'ar', 'hi', 'tl'] as const) {
  test(`${locale} missing pages preserve language, direction and recovery links`, async ({page}) => {
    test.skip(!isPublishedLocale(locale), 'This translation is not published.');
    const t = translator(JSON.parse(await readFile(`src/data/locales/${locale}.json`, 'utf8')));
    const response = await page.goto(`/${locale}/missing/deep/page`);
    expect(response?.status()).toBe(404);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page).toHaveTitle(`${t('Page not found.')} | Finflo`);
    await expect(page.getByRole('heading', {level: 1})).toHaveText(t('Page not found.'));
    await expect(page.locator('[data-system-page] a.button-primary')).toHaveAttribute('href', `/${locale}/calculators`);
    await expect(page.locator('[data-system-page] a.button-secondary')).toHaveAttribute('href', `/${locale}`);
    await expect(page.getByRole('heading', {level: 2, name: t('Popular calculators')})).toBeVisible();
    await expect(page.locator('[data-calculator-card="percent-calculator"] a')).toHaveAttribute('href', `/${locale}/percent-calculator`);
    await expect(page.locator('[data-calculator-card="percent-calculator"] p')).toHaveText(t('description.percent-calculator'));
    await page.locator('[data-system-page] a.button-primary').click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/calculators$`));
  });
}

test('404 recovery works with keyboard input and the saved theme', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('finflo.theme.v1', 'dark'));
  await page.goto('/missing/deep/page');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(16, 17, 19)');
  await page.locator('[data-system-page] a.button-primary').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-system-page] a.button-secondary')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('global 404 retains its layout and recovery links without JavaScript', async ({browser, baseURL}) => {
  const context = await browser.newContext({javaScriptEnabled: false, baseURL});
  const page = await context.newPage();
  try {
    const response = await page.goto('/missing/deep/page');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', {level: 1})).toHaveText('Page not found.');
    await expect(page.locator('header')).toBeVisible();
    await page.locator('[data-calculator-card="percent-calculator"] a').click();
    await expect(page).toHaveURL(/\/percent-calculator$/);
  } finally {await context.close();}
});

for (const path of ['/missing/deep/page', '/ar/missing/deep/page']) test(`${path} fits mobile screens and has accessible recovery controls`, async ({page}) => {
  test.skip(!isPublishedLocale(splitLocale(path).locale), 'This translation is not published.');
  await page.setViewportSize({width: 360, height: 800});
  await page.goto(path);
  await expect(page.locator('[data-system-page] a.button-primary')).toBeVisible();
  await expect(page.locator('[data-system-page] a.button-secondary')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});

test('existing support and policy pages are reachable and retain the shared design', async ({page}) => {
  for (const path of ['/about', '/contact', '/privacy', '/terms', '/cookies', '/accessibility', '/disclaimer', '/editorial-policy', '/methodology', '/sitemap']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole('heading', {level: 1})).toHaveCount(1);
    await expect(page.locator('[data-page-hero], [data-search-hero]').first()).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  }
});

for (const prefix of ['', '/es', '/ar']) test(`${prefix || 'English'} connection and maintenance pages use the shared system layout`, async ({page}) => {
  test.skip(!isPublishedLocale(splitLocale(prefix).locale), 'This translation is not published.');
  for (const path of ['/offline', '/network-error', '/maintenance']) {
    const response = await page.goto(prefix + path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('[data-system-page]')).toBeVisible();
    await expect(page.locator('[data-system-page] a[href="' + prefix + '/calculators"]')).toBeVisible();
    expect(await page.locator('meta[name="robots"]').evaluateAll(nodes => nodes.some(node => /noindex/.test(node.getAttribute('content') || '')))).toBe(true);
    if (path !== '/maintenance') {
      await expect(page.locator('[data-system-page] button')).toHaveCount(1);
      await Promise.all([page.waitForEvent('load'), page.locator('[data-system-page] button').click()]);
      await expect(page).toHaveURL(new RegExp(prefix + path + '$'));
    }
  }
});
