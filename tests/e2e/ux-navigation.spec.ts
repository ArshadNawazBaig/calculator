import {test, expect} from '@playwright/test';

test('mobile calculator shortcuts cross the full table and return keyboard focus to inputs', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/loan-calculator');
  const nav = page.getByRole('navigation', {name: 'On this page'});
  await expect(page.locator('#calculation-table tbody tr')).toHaveCount(360);
  await nav.getByRole('link', {name: 'How it works'}).click();
  await expect(page.locator('#how-it-works')).toBeFocused();
  expect((await nav.boundingBox())!.y).toBe(0);
  expect((await page.locator('#how-it-works').boundingBox())!.y).toBeGreaterThan((await nav.boundingBox())!.height);
  await nav.getByRole('link', {name: 'Your inputs'}).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#calculator-inputs')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#loan-principal')).toBeFocused();
  await page.locator('#loan-principal').fill('1200');
  await page.locator('#loan-rate').fill('0');
  await page.locator('#loan-years').fill('1');
  await nav.getByRole('link', {name: 'Results', exact: true}).click();
  await expect(page.locator('#calculation-summary')).toBeFocused();
  await expect(page.locator('#calculation-summary .stale-note')).toBeInViewport();
  await nav.getByRole('link', {name: 'Your inputs'}).click();
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('$100.00');
  await expect(page.locator('.primary-metric dd')).toBeInViewport();
  await expect(page.locator('#calculation-table tbody tr')).toHaveCount(12);
  await page.emulateMedia({media: 'print'});
  await expect(nav).toBeHidden();
  await expect(page.locator('#calculation-table tbody tr').last()).toBeVisible();
});

test('directory categories remain reachable after a long scroll', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/calculators');
  const nav = page.getByRole('navigation', {name: 'Jump to category'});
  await nav.getByRole('link', {name: /Everyday/}).click();
  expect((await nav.boundingBox())!.y).toBe(0);
  expect((await page.locator('#everyday').boundingBox())!.y).toBeGreaterThan((await nav.boundingBox())!.height);
  await nav.getByRole('link', {name: /Finance/}).click();
  await expect(page.locator('#finance h2').first()).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('localized calculator shortcuts fit and target the same sections', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  for (const locale of ['ar', 'de', 'hi']) {
    await page.goto(`/${locale}/bmi-calculator`);
    const nav = page.locator('nav').filter({has: page.locator('a[href="#calculation-summary"]')});
    await expect(nav.getByRole('link')).toHaveCount(3);
    await nav.locator('a[href="#how-it-works"]').click();
    await expect(page.locator('#how-it-works')).toBeFocused();
    expect((await page.locator('#how-it-works').boundingBox())!.y).toBeGreaterThan((await nav.boundingBox())!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
