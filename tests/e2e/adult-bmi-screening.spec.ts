import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('adult screening explains a rounded boundary and reaches the actual child percentile mode', async ({page}) => {
  await page.goto('/overweight-calculator');
  const guide = page.locator('#adult-screening-guide');
  await expect(guide.getByRole('heading', {level: 2})).toHaveText('Read an adult BMI category in three steps');
  await page.locator('#adult-height').fill('175');
  await page.locator('#adult-weight').fill('76.56');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('#calculation-summary')).toContainText('Healthy-weight range');
  await expect(page.locator('#calculation-summary')).toContainText('before display rounding');
  await page.locator('#adult-weight').fill('76.5625');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('#calculation-summary')).toContainText('Overweight');
  await guide.getByRole('link', {name: 'Child and teen BMI-for-age: ages 2–19', exact: true}).click();
  await expect(page).toHaveURL(/\/bmi-calculator#mode-child$/);
  await expect(page.locator('#child-ageYears')).toBeVisible();
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('#calculation-summary')).toContainText('BMI-for-age percentile');
});

test('screening tables remain accessible on mobile and readable without JavaScript', async ({page, browser}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/overweight-calculator');
  const guide = page.locator('#adult-screening-guide');
  await expect(guide.getByRole('table')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const accessibility = await new AxeBuilder({page}).include('#adult-screening-guide').analyze();
  expect(accessibility.violations).toEqual([]);
  const context = await browser.newContext({javaScriptEnabled: false});
  try {
    const staticPage = await context.newPage();
    await staticPage.goto(`${test.info().project.use.baseURL}/overweight-calculator`);
    await expect(staticPage.getByRole('table', {name: 'CDC adult screening categories, age 20 and older'})).toBeVisible();
    await expect(staticPage.getByRole('table', {name: 'A fixed numerical example at 175 cm, not recommended weights'})).toBeVisible();
    await expect(staticPage.locator('#adult-screening-guide')).toContainText('24.999183');
  } finally {await context.close();}
});
