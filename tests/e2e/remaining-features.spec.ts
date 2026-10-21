import {isPublishedLocale} from '../../src/lib/i18n/config';
import {test, expect, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync} from 'node:fs';
const choose = async (page: Page, title: string) => {
  await page.locator('#calculation-mode').click();
  await page.getByRole('option', {name: title, exact: true}).click();
};
const calculate = (page: Page) => page.getByRole('button', {name: 'Calculate', exact: true}).click();

test('regional sizing and documented boundaries work in the form', async ({page}) => {
  await page.goto('/bra-size-calculator');
  await choose(page, 'International bra label conversion');
  await calculate(page);
  await expect(page.locator('.primary-metric dd')).toHaveText('34DDD');
  await page.locator('#regional-labels-band').fill('28');
  await calculate(page);
  await expect(page.locator('.form-error[role=alert]')).toContainText('outside the selected Wacoal convention');
  await page.goto('/shoe-size-conversion');
  await choose(page, 'Regional shoe sizes and age groups');
  await page.getByRole('button', {name: /Source-size system/}).click();
  await page.getByRole('option', {name: 'UK', exact: true}).click();
  await page.locator('#regional-chart-size').fill('6');
  await calculate(page);
  await expect(page.locator('.primary-metric dd')).toHaveText('2');
  await expect(page.locator('#calculation-table')).toContainText('39');
  await expect(page.locator('#calculation-table')).toContainText('40');
});

test('heat loss, mixed golf and dated NEC modes calculate', async ({page}) => {
  await page.goto('/btu-calculator');
  await choose(page, 'Steady heating loss');
  await calculate(page);
  await expect(page.locator('.primary-metric dd')).not.toBeEmpty();
  await page.locator('#heat-loss-outdoor').fill('25');
  await calculate(page);
  await expect(page.locator('.form-error[role=alert]')).toContainText('Indoor temperature must be at least');
  await page.goto('/golf-handicap-calculator');
  await choose(page, 'Mixed rounds with verified differentials');
  await calculate(page);
  await expect(page.locator('.primary-metric dd')).toHaveText('8');
  await expect(page.locator('#calculation-table')).toContainText('Example only');
  await page.goto('/voltage-drop-calculator');
  await choose(page, '2017 NEC impedance reference');
  await calculate(page);
  await expect(page.locator('.primary-metric dd')).toHaveText('2.23 V');
});

test('road mileage requires chosen locations, handles service errors, and resets', async ({page}) => {
  const requests: Record<string, unknown>[] = [];
  let failRoute = false;
  await page.route('**/api/road-route', async route => {
    const body = route.request().postDataJSON(); requests.push(body);
    if (body.kind === 'search') await route.fulfill({json: {places: [{lat: 51.5, lon: -.1, label: body.query + ', UK'}, {lat: 42.9, lon: -81.2, label: body.query + ', Canada'}]}});
    else if (failRoute) await route.fulfill({status: 503, json: {error: 'The map service is temporarily unavailable. Try again later.'}});
    else await route.fulfill({json: {meters: 16093.44, seconds: 1200, retrievedAt: '2026-10-10T00:00:00Z', snapped: [{lat: 51.5, lon: -.1, distance: 5}, {lat: 52.2, lon: .1, distance: 10}]}});
  });
  await page.goto('/mileage-calculator');
  await expect(page.getByRole('heading', {name: 'Your answer starts here'})).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.getByLabel('Origin', {exact: true}).fill('London');
  await page.getByLabel('Destination', {exact: true}).fill('Cambridge');
  expect(requests).toHaveLength(0); // No autocomplete or initial geocoding.
  await page.getByRole('button', {name: 'Find place', exact: true}).first().click();
  await expect(page.getByRole('button', {name: 'London, Canada', exact: true})).toBeVisible();
  await calculate(page);
  await expect(page.locator('.form-error[role=alert]')).toContainText('select both route locations');
  await page.getByRole('button', {name: 'London, UK', exact: true}).click();
  await page.getByRole('button', {name: 'Find place', exact: true}).last().click();
  await page.getByRole('button', {name: 'Cambridge, UK', exact: true}).click();
  await calculate(page);
  await expect(page.locator('.primary-metric dd')).toContainText('10');
  expect(requests.at(-1)).toMatchObject({kind: 'route', from: {lat: 51.5, lon: -.1}});
  failRoute = true;
  await calculate(page);
  await expect(page.locator('.form-error[role=alert]')).toContainText('temporarily unavailable');
  await expect(page.locator('.primary-metric')).toHaveCount(0);
  await page.getByRole('button', {name: 'Reset', exact: true}).click();
  await expect(page.getByLabel('Origin', {exact: true})).toHaveValue('');
  await expect(page.getByText('Selected location:', {exact: false})).toHaveCount(0);
});

test('new forms fit mobile and the map controls are accessible', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/mileage-calculator');
  const audit = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations.map(v => v.id)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/golf-handicap-calculator');
  await choose(page, 'Mixed rounds with verified differentials');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const locale of ['es', 'fr', 'de', 'pt', 'ar'] as const) test(`${locale}: new mode labels and map errors are translated`, async ({page}) => {
  test.skip(!isPublishedLocale(locale), 'This translation is not published.');
  const content: Record<string, string> = JSON.parse(readFileSync(`src/data/locales/content/${locale}.json`, 'utf8'));
  const ui: Record<string, string> = JSON.parse(readFileSync(`src/data/locales/${locale}.json`, 'utf8'));
  const t = (key: string) => ui[key] || content[key];
  await page.goto(`/${locale}/bra-size-calculator`);
  await choose(page, t('International bra label conversion'));
  await page.locator('.calculator-form button[type=submit]').click();
  await expect(page.locator('.primary-metric dd')).toHaveText('34DDD');
  await page.locator('#regional-labels-band').fill('28');
  await page.locator('.calculator-form button[type=submit]').click();
  await expect(page.locator('.form-error[role=alert]')).toHaveText(t('This band or cup is outside the selected Wacoal convention. Use the linked size guide to check the label.'));
  await page.route('**/api/road-route', route => route.fulfill({status: 503, json: {error: 'The map service is temporarily unavailable. Try again later.'}}));
  await page.goto(`/${locale}/mileage-calculator`);
  await page.locator('#road-place-1').fill('London');
  await page.locator('#road-place-1').locator('..').getByRole('button').click();
  await expect(page.locator('.form-error[role=alert]')).toHaveText(t('The map service is temporarily unavailable. Try again later.'));
});
