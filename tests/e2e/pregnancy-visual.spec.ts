import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('pregnancy graphics and sharing metadata are available without JavaScript', async ({browser, request}) => {
  const context = await browser.newContext({javaScriptEnabled: false, viewport: {width: 390, height: 844}});
  const page = await context.newPage();
  await page.goto('/pregnancy-calculator', {waitUntil: 'domcontentloaded'});

  await expect(page).toHaveTitle('Pregnancy Calculator: Due Date & Gestational Age');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://finflo.org/pregnancy-calculator');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /due date and pregnancy weeks/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://finflo.org/illustrations/pregnancy/pregnancy-due-date-social.jpg');
  await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute('content', /pregnant person.*calendar/);

  const graphic = page.locator('[data-pregnancy-visual]');
  await expect(graphic.getByRole('img')).toHaveAttribute('alt', /pregnant person.*calendar/);
  await expect(graphic).toContainText('A 28-day cycle example');
  await expect(graphic).toContainText('40 weeks · 280 days');
  await expect(graphic).toContainText('38 weeks · 266 days');
  await expect(graphic).toContainText('Ovulation varies');
  await expect(graphic.getByRole('link')).toHaveAttribute('href', /acog\.org/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  for (const path of ['/illustrations/pregnancy/pregnancy-dating.webp', '/illustrations/pregnancy/pregnancy-due-date-social.jpg']) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toMatch(/^image\//);
  }
  await context.close();
});

test('the mobile graphic is localized, accessible and leaves the calculator usable', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/ar/pregnancy-calculator');
  const graphic = page.locator('[data-pregnancy-visual]');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(graphic).toContainText('مثال لدورة مدتها 28 يومًا');
  await expect(graphic.getByRole('img')).toHaveAttribute('alt', /حامل/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://finflo.org/ar/pregnancy-calculator');
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /حامل/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).include('[data-pregnancy-visual]').analyze()).violations).toEqual([]);

  await page.goto('/pregnancy-calculator');
  await page.locator('[data-calculator-submit]').click();
  await expect(page.locator('#calculation-summary')).toContainText('2027-04-07');
  await expect(page.locator('#calculation-summary')).toContainText('14 weeks, 2 days');
  await page.emulateMedia({colorScheme: 'dark'});
  expect((await new AxeBuilder({page}).include('[data-pregnancy-visual]').analyze()).violations).toEqual([]);
});
