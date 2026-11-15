import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('ratio accepts decimal and fraction inputs with exact visible steps', async ({page}) => {
  await page.setViewportSize({width: 360, height: 800});
  await page.goto('/ratio-calculator');
  await page.getByLabel('First quantity', {exact: true}).fill('1/2');
  await page.getByLabel('Second quantity', {exact: true}).fill('3/4');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('2 : 3');
  await expect(page.locator('#calculation-table')).toContainText('Multiply both terms by 4');
  await page.getByLabel('First quantity', {exact: true}).fill('0.1');
  await page.getByLabel('Second quantity', {exact: true}).fill('0.3');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('1 : 3');
  await page.locator('#formula-reference').getByRole('link', {name: 'Find A', exact: true}).click();
  await expect(page.locator('#calculator-inputs')).toHaveAttribute('data-mode', 'all-proportions');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('salary conversion compares biweekly and semimonthly gross pay separately from unpaid leave', async ({page}) => {
  await page.goto('/salary-calculator');
  await page.locator('#salary-amount').fill('25');
  await page.locator('#salary-leave').fill('10');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toContainText('52,000');
  const table = page.locator('#calculation-table');
  await expect(table.getByRole('row').filter({hasText: 'Biweekly (26 per year)'})).toContainText('2,000');
  await expect(table.getByRole('row').filter({hasText: 'Semimonthly (24 per year)'})).toContainText('2,166.67');
  await expect(page.locator('.results-region')).toContainText('50,000');
});

test('priority-page references are readable and accessible on narrow screens', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  for (const slug of ['salary', 'height', 'date', 'rounding', 'scientific-notation', 'time-duration']) {
    await page.goto(`/${slug}-calculator`);
    await expect(page.locator('section[id^="understanding-"] table').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), slug).toBe(true);
    expect((await new AxeBuilder({page}).include('section[id^="understanding-"]').analyze()).violations, slug).toEqual([]);
  }
});
