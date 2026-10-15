import {expect, test} from '@playwright/test';
import {studentTools} from '../../src/lib/student-tools';

for (const tool of studentTools) test(`${tool.title} has a distinct page, server-rendered metadata, and related links`, async ({page, request}) => {
  const response = await request.get(`/${tool.slug}`);
  expect(response.status()).toBe(200);
  const html = await response.text();
  const escapedTitle = tool.seoTitle.replaceAll('&', '&amp;');
  expect(html).toContain(`<title>${escapedTitle}</title>`);
  expect(html).toContain(`name="description" content="${tool.description}"`);
  await page.goto(`/${tool.slug}`);
  await expect(page.getByRole('heading', {level: 1})).toHaveText(tool.title);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://finflo.org/${tool.slug}`);
  const links = page.getByRole('navigation', {name: 'Student calculators'});
  for (const other of studentTools) await expect(links.getByRole('link', {name: new RegExp(other.title)})).toHaveAttribute('href', `/${other.slug}`);
});

test('old mode links open the new page and preserve the selected language', async ({page}) => {
  for (const [from, to, input] of [
    ['/grade-calculator#mode-final', '/final-exam-grade-calculator#mode-final', '#final-current'],
    ['/grade-calculator#mode-letter-final', '/final-exam-grade-calculator#mode-letter-final', '#letter-final-current'],
    ['/gpa-calculator#mode-target', '/gpa-goal-calculator#mode-target', '#target-current'],
    ['/es/gpa-calculator#mode-target', '/es/gpa-goal-calculator#mode-target', '#target-current'],
  ]) {
    await page.goto(from);
    await expect(page).toHaveURL(new RegExp(to + '$'));
    await expect(page.locator(input)).toBeVisible();
  }
});

test('saved GPA plans survive moving from the GPA page to the GPA goal page', async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('finflo-workspace-v1', JSON.stringify({version: 1, favorites: [], calculations: [{
      id: 'old-gpa-plan', name: 'My plan', slug: 'gpa-calculator', title: 'GPA Calculator', modeId: 'target',
      modeTitle: 'Target GPA planner', algorithm: 'gpa-target',
      values: {current: '3.2', credits: '60', target: '3.5', future: '60', maximum: '4', scenarios: '[]'},
      inputs: [], labels: {}, metrics: [{label: 'Required future GPA', value: 3.8}],
      currency: 'USD', currencyLabels: false, expressionAnswer: null, createdAt: '2026-10-15T00:00:00Z',
    }]}));
  });
  await page.goto('/gpa-calculator#saved=old-gpa-plan');
  await expect(page).toHaveURL(/\/gpa-goal-calculator#saved=old-gpa-plan$/);
  await expect(page.locator('#target-future')).toHaveValue('60');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('3.8');
});

test('student directory opens the final exam workflow and links back to GPA and weighted grades', async ({page}) => {
  await page.goto('/calculators');
  await page.getByRole('navigation', {name: 'Student calculators'}).getByRole('link', {name: 'Final Exam Grade Calculator'}).click();
  await expect(page.locator('#final-current')).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://finflo.org/final-exam-grade-calculator');
  await page.locator('#final-target').fill('88');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('95%');
  await page.getByRole('navigation', {name: 'Student calculators'}).getByRole('link', {name: 'Weighted Grade Calculator'}).click();
  await expect(page.locator('#categories-categories-2-score')).toHaveValue('');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('84.29%');
  await expect(page.locator('.result-metrics')).toContainText('86%');
  await page.goBack();
  await expect(page.locator('#final-current')).toBeVisible();
  await page.getByRole('navigation', {name: 'Student calculators'}).getByRole('link', {name: 'College GPA Calculator'}).click();
  await expect(page.locator('#semester-grades-previousCredits')).toBeVisible();
});

test('GPA goals show limits and compare projected scenarios', async ({page}) => {
  await page.goto('/gpa-goal-calculator');
  await expect(page.locator('#target-current')).toBeVisible();
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('Target not attainable');
  await expect(page.locator('#calculation-table')).toContainText('3.47');
  await page.locator('#target-future').fill('60');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('3.8');
  await expect(page.locator('#calculation-table')).toContainText('Yes');
  await page.reload();
  await expect(page.locator('#target-current')).toBeVisible();
});

test('mobile category scores distinguish a zero from ungraded work', async ({page}) => {
  await page.setViewportSize({width: 360, height: 800});
  await page.goto('/grade-calculator#mode-categories');
  await page.locator('#categories-categories-2-score').fill('0');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('59%');
  await expect(page.locator('.result-metrics')).toContainText('86%');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', {name: 'Calculate a grade from earned and possible points'}).click();
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('83.33%');
});
