import {test, expect, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const background = (page: Page) => page.locator('body').evaluate(body => getComputedStyle(body).backgroundColor);

test('stays dark across device preferences, saved settings, and languages', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('finflo.theme.v1', 'light'));
  await page.emulateMedia({colorScheme: 'light'});
  for (const path of ['/', '/loan-calculator', '/ar']) {
    await page.goto(path);
    await expect.poll(() => background(page)).toBe('rgb(16, 17, 19)');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#101113');
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');
  }
  await page.emulateMedia({colorScheme: 'dark'});
  await expect.poll(() => background(page)).toBe('rgb(16, 17, 19)');
  await page.emulateMedia({colorScheme: 'light'});
  await expect.poll(() => background(page)).toBe('rgb(16, 17, 19)');
  await page.goto('/');
  await expect(page.getByRole('button', {name: 'Appearance', exact: true})).toHaveCount(0);
});

test('dark theme remains accessible, fits mobile headers, and prints clearly', async ({page}) => {
  await page.emulateMedia({colorScheme: 'light'});
  await page.goto('/');
  for (const width of [320, 390, 1280, 1440]) {
    await page.setViewportSize({width, height: 900});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const buttons = await page.locator('header button:visible').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect(); return {left: rect.left, right: rect.right};
    }));
    for (let i = 1; i < buttons.length; i++) expect(buttons[i].left).toBeGreaterThanOrEqual(buttons[i - 1].right);
  }
  const home = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(home.violations).toEqual([]);
  await page.goto('/loan-calculator');
  const calculator = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(calculator.violations).toEqual([]);
  await page.emulateMedia({media: 'print'});
  await expect.poll(() => background(page)).toBe('rgb(255, 255, 255)');
});
