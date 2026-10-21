import {isPublishedLocale} from '../../src/lib/i18n/config';
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

test('directory categories open their pages and remain reachable after a long scroll', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  const nav = page.getByRole('navigation', {name: 'Browse by category'});
  for (const path of ['/calculators/students', '/calculators/finance', '/calculators/health', '/calculators/math', '/calculators/everyday', '/time', '/spin-wheels']) {
    await page.goto('/calculators');
    await nav.locator(`a[href="${path}"]`).click();
    await expect(page).toHaveURL(new RegExp(path + '$'));
    await expect(page.getByRole('heading', {level: 1})).toBeVisible();
    if (path.startsWith('/calculators/')) await expect(nav.locator('[aria-current="page"]')).toHaveAttribute('href', path);
  }
  await page.goto('/calculators/everyday');
  await page.evaluate(() => window.scrollTo(0, 1200));
  expect((await nav.boundingBox())!.y).toBe(0);
  await nav.getByRole('link', {name: /Finance/}).click();
  await expect(page).toHaveURL(/\/calculators\/finance$/);
  await expect(page.getByRole('heading', {level: 1})).toHaveText('Financial calculators');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('category links keep the language and the student hub links to its four calculators', async ({page}) => {
  test.skip(!isPublishedLocale('es')&&!isPublishedLocale('ar'), 'These translations are not published.');
  await page.setViewportSize({width: 320, height: 740});
  for (const locale of ['es', 'ar'] as const) {
    if(!isPublishedLocale(locale))continue;
    await page.goto(`/${locale}/calculators`);
    const nav = page.locator('[data-category-navigation]');
    const students = nav.locator(`a[href="/${locale}/calculators/students"]`);
    await students.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/${locale}/calculators/students$`));
    await expect(page.getByRole('heading', {level: 1})).not.toHaveText('Student calculators');
    await expect(nav.locator('[aria-current="page"]')).toHaveAttribute('href', `/${locale}/calculators/students`);
    for (const slug of ['grade-calculator', 'final-exam-grade-calculator', 'gpa-calculator', 'gpa-goal-calculator']) {
      await expect(page.locator(`#student-calculators a[href="/${locale}/${slug}"]`)).toHaveCount(1);
    }
    await expect(nav.locator(`a[href="/${locale}/time"]`)).toHaveCount(1);
    await expect(nav.locator(`a[href="/${locale}/spin-wheels"]`)).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('localized calculator shortcuts fit and target the same sections', async ({page}) => {
  test.skip(!(['ar','de','hi'] as const).some(isPublishedLocale), 'These translations are not published.');
  await page.setViewportSize({width: 320, height: 740});
  for (const locale of ['ar', 'de', 'hi'] as const) {
    if(!isPublishedLocale(locale))continue;
    await page.goto(`/${locale}/bmi-calculator`);
    const nav = page.locator('nav').filter({has: page.locator('a[href="#calculation-summary"]')});
    await expect(nav.getByRole('link')).toHaveCount(3);
    await nav.locator('a[href="#how-it-works"]').click();
    await expect(page.locator('#how-it-works')).toBeFocused();
    expect((await page.locator('#how-it-works').boundingBox())!.y).toBeGreaterThan((await nav.boundingBox())!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
