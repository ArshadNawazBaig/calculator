import {test, expect, type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import AxeBuilder from '@axe-core/playwright';

const choose = async (page: Page, id: string, label: string) => {
  await page.locator(`#${id}`).click();
  await page.getByRole('option', {name: label, exact: true}).click();
};
for (const locale of ['en', 'es', 'fr', 'de', 'pt', 'ar']) test(`${locale}: free intensity guide works and unfinished tools are removed`, async ({page, request}) => {
  const messages: Record<string, string> = locale === 'en' ? {} : {...JSON.parse(readFileSync(`src/data/locales/${locale}.json`, 'utf8')), ...JSON.parse(readFileSync(`src/data/locales/content/${locale}.json`, 'utf8'))};
  const t = (key: string) => messages[key] || key;
  const prefix = locale === 'en' ? '' : `/${locale}`;
  await page.setViewportSize({width: 390, height: 844});
  await page.goto(`${prefix}/target-heart-rate-calculator`);
  await expect(page.locator('main')).not.toContainText(/Borg|Khamis|WeightWatch/i);
  await choose(page, 'calculation-mode', t('Talk test for exercise intensity'));
  for (const [choice, answer] of [
    ['Conversation is comfortable, but singing is difficult', 'Moderate relative intensity'],
    ['A few words require a pause for breath', 'Vigorous relative intensity'],
    ['Neither description fits / I am unsure', 'Not classified'],
  ]) {
    await choose(page, 'talk-test-speech', t(choice));
    await page.locator('.calculator-form button[type=submit]').click();
    await expect(page.locator('.primary-metric dd')).toHaveText(t(answer));
  }
  if (locale === 'es') {
    const download = page.waitForEvent('download');
    await page.getByRole('button', {name: 'CSV', exact: true}).click();
    const csv = readFileSync((await (await download).path())!, 'utf8');
    expect(csv).toContain(t('Not classified'));
    expect(csv).not.toContain('Not classified');
  }
  await page.getByRole('button', {name: t('Reset'), exact: true}).click();
  await expect(page.locator('#talk-test-speech')).toContainText(t('Conversation is comfortable, but singing is difficult'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (locale === 'en') {
    const result = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations.map(v => v.id)).toEqual([]);
  }
  const removed = await request.get(`${prefix}/weight-watchers-points-calculator`);
  expect(removed.status()).toBe(404);
  expect(await removed.text()).toMatch(/name="robots" content="noindex/);
  await page.goto(`${prefix}/calculators/health`);
  await expect(page.locator('a[href*="weight-watchers"]')).toHaveCount(0);
  await expect(page.locator('[data-calculator-card]')).not.toHaveCount(0);
  await page.goto(`${prefix}/search?q=weight%20watchers`);
  await expect(page.locator('[data-calculator-card]')).toHaveCount(0);
  const search = page.getByRole('combobox');
  await search.fill('weight watchers');
  await expect(page.getByRole('option')).toHaveCount(0);
  for (const slug of ['height-calculator', 'calorie-calculator', 'macro-calculator']) {
    await page.goto(`${prefix}/${slug}`);
    await expect(page.locator('.calculator-form')).toBeVisible();
    await expect(page.locator('main')).not.toContainText(/Borg|Khamis|WeightWatch/i);
  }
});
