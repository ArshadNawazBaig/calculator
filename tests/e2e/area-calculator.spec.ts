import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('area shape selection, mixed units and land results work on mobile', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/area-calculator');
  const choices = page.getByRole('group', {name: 'Choose a shape'});
  await expect(choices.getByRole('button')).toHaveCount(9);
  await page.locator('#rectangle-a').fill('150');
  await page.locator('#rectangle-aUnit').click();
  await page.getByRole('option', {name: 'Feet', exact: true}).click();
  await page.locator('#rectangle-b').fill('2400');
  await page.locator('#rectangle-bUnit').click();
  await page.getByRole('option', {name: 'Inches', exact: true}).click();
  await page.locator('#rectangle-outputUnit').click();
  await page.getByRole('option', {name: 'Acres', exact: true}).click();
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toContainText('0.69');
  await expect(page.locator('.primary-metric dd')).toContainText('ac');
  await choices.getByRole('button', {name: 'Square', exact: true}).click();
  await expect(choices.getByRole('button', {name: 'Square', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#square-a').fill('4');
  await choices.getByRole('button', {name: 'Square', exact: true}).click();
  await expect(page.locator('#square-a')).toHaveValue('4');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('16 m²');
  await page.locator('#method-circle a').click();
  await expect(choices.getByRole('button', {name: 'Circle', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#circle-r')).toBeVisible();
  await page.locator('#circle-r').fill('3');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toContainText('28.27');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
  const accessibility = await new AxeBuilder({page}).include('.calculator-workspace').analyze();
  expect(accessibility.violations).toEqual([]);
});

test('shape links restore their mode and reject impossible geometry', async ({page}) => {
  await page.goto('/area-calculator#mode-triangle-sss');
  await expect(page.locator('#triangle-sss-a')).toBeVisible();
  await page.locator('#triangle-sss-a').fill('3');
  await page.locator('#triangle-sss-b').fill('4');
  await page.locator('#triangle-sss-c').fill('7');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('#calculator-inputs').getByRole('alert')).toBeVisible();
  await page.getByRole('button', {name: 'Sector', exact: true}).click();
  await page.locator('#sector-angleUnit').click();
  await page.getByRole('option', {name: 'Radians', exact: true}).click();
  await page.locator('#sector-angle').fill('3*pi');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('#calculator-inputs').getByRole('alert')).toContainText('360');
  await page.reload();
  await expect(page.getByRole('button', {name: 'Sector', exact: true})).toHaveAttribute('aria-pressed', 'true');
});

test('area diagrams, formula links and land guidance are available without JavaScript', async ({browser, baseURL}) => {
  const context = await browser.newContext({javaScriptEnabled: false, baseURL});
  try {
    const page = await context.newPage();
    await page.goto('/area-calculator');
    await expect(page.locator('#formula-reference svg[role="img"]')).toHaveCount(9);
    await expect(page.locator('#formula-reference tbody a[href^="#mode-"]')).toHaveCount(9);
    await expect(page.locator('#land-area')).toContainText('43,560');
    await expect(page.locator('#sources')).toContainText('NIST');
    await expect(page.locator('#common-questions details')).toHaveCount(6);
    await expect(page.locator('time[datetime="2026-11-15"]')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Enter positive dimensions in one consistent unit');
  } finally {
    await context.close();
  }
});
