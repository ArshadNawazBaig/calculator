import {expect, test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('worked figures and their numbers are readable on mobile without JavaScript', async ({browser, baseURL}) => {
  const context = await browser.newContext({baseURL, javaScriptEnabled: false, viewport: {width: 320, height: 720}});
  const page = await context.newPage();
  try {
    for (const [path, slug, result] of [
      ['/mortgage-calculator', 'mortgage-calculator', '$1,550'],
      ['/de/surface-area-calculator', 'surface-area-calculator', '122,52 cm²'],
      ['/ar/tile-calculator', 'tile-calculator', '١٢'],
      ['/es/real-estate-calculator', 'real-estate-calculator', '240'],
    ]) {
      await page.goto(path);
      const figure = page.locator(`[data-calculator-example="${slug}"]`);
      const title = await figure.getByRole('heading').innerText();
      await expect(figure).toHaveAccessibleName(title);
      const table = figure.getByRole('table', {name: title});
      await expect(table.getByRole('columnheader')).toHaveCount(3);
      await expect(table.getByRole('rowheader')).toHaveCount(2);
      await expect(table.getByRole('row').nth(2).getByRole('cell').last()).toContainText(result);
      const img = figure.getByRole('img');
      await expect(img).toHaveAttribute('src', `/illustrations/examples/${slug}.webp`);
      await expect(img).toHaveAccessibleName(/A .+B /);
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
    }
    await page.goto('/volume-calculator');
    await expect(page.locator('[data-calculator-example]')).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('the localized example table is keyboard accessible and has no detected accessibility violations', async ({page}) => {
  await page.goto('/ar/bmi-calculator');
  const scope = '[data-calculator-example="bmi-calculator"]';
  const region = page.locator(scope).getByRole('region');
  await region.focus();
  await expect(region).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  const results = await new AxeBuilder({page}).include(scope).analyze();
  expect(results.violations).toEqual([]);
});
