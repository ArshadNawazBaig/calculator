import {test, expect, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync} from 'node:fs';
const pick = async (page: Page, id: string, option: string) => {
  await page.locator(`#${id}`).click();
  await page.getByRole('option', {name: option, exact: true}).click();
};
const start = async (page: Page) => {
  await page.goto('/btu-calculator');
  await pick(page, 'calculation-mode', 'US room and building heat transfer');
};
const calculate = (page: Page) => page.locator('.calculator-form button[type=submit]').click();

test('US reference form calculates, changes counties and preserves unit conversions', async ({page}) => {
  await start(page);
  await expect(page.locator('#us-design-county')).toContainText('Travis');
  await page.locator('summary').filter({hasText: 'Outdoor air and additional loads'}).click();
  await page.locator('#us-design-ach').fill('0');
  await calculate(page);
  await expect(page.locator('.primary-metric dd')).toContainText('1,390.2');
  await pick(page, 'us-design-units', 'Metric');
  await expect(page.locator('#us-design-length')).toHaveValue('6.096');
  await calculate(page);
  await expect(page.locator('.primary-metric dd')).toContainText('1,390.2');
  await pick(page, 'us-design-state', 'Alaska');
  await expect(page.locator('#us-design-county')).toContainText('Aleutians East');
  await pick(page, 'us-design-county', 'Fairbanks North Star');
  await calculate(page);
  await expect(page.locator('#calculation-summary').getByText('Alaska — Fairbanks North Star', {exact: true})).toBeVisible();
  await expect(page.locator('.calculator-form')).not.toContainText('Travis');
});

test('geometry validation and whole-building controls prevent double-counted openings', async ({page}) => {
  await start(page);
  await page.locator('summary').filter({hasText: 'Envelope and insulation'}).click();
  await page.locator('#us-design-windowArea').fill('150');
  await calculate(page);
  await expect(page.locator('.form-error[role=alert]')).toContainText('Window and door areas cannot exceed');
  await pick(page, 'us-design-space', 'Rectangular whole building');
  await expect(page.locator('#us-design-exposedWallLength')).toHaveCount(0);
  await page.locator('#us-design-stories').fill('2');
  await calculate(page);
  await expect(page.locator('.form-error[role=alert]')).toHaveCount(0);
  await expect(page.locator('.primary-metric dd')).not.toBeEmpty();
  await page.getByRole('button', {name: 'Reset', exact: true}).click();
  await expect(page.locator('#us-design-space')).toContainText('One rectangular room');
  await expect(page.locator('#us-design-windowArea')).toHaveValue('30');
});

test('cooling accepts explicit gains and keeps its scope visible', async ({page}) => {
  await start(page);
  await pick(page, 'us-design-season', 'Cooling heat-gain subtotal');
  await expect(page.locator('#us-design-indoor')).toHaveValue('75');
  await page.locator('summary').filter({hasText: 'Outdoor air and additional loads'}).click();
  await expect(page.locator('#us-design-additionalHeating')).toHaveCount(0);
  await page.locator('#us-design-solarGain').fill('500');
  await page.locator('#us-design-internalGain').fill('200');
  await page.locator('#us-design-latentGain').fill('100');
  await calculate(page);
  await expect(page.locator('.primary-metric dt')).toHaveText('Steady cooling subtotal');
  await expect(page.getByText('This steady estimate does not size HVAC equipment, determine a time-dependent cooling peak, or certify Manual J or current code compliance.', {exact: true})).toBeVisible();
});

test('US design controls fit mobile and pass an accessibility check', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await start(page);
  await page.locator('summary').filter({hasText: 'Envelope and insulation'}).click();
  await pick(page, 'us-design-envelope', 'Enter actual assembly U-values');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const audit = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations.map(v => v.id)).toEqual([]);
});

for (const locale of ['es','fr','de','pt','ar']) test(`${locale}: design controls translate and county names stay intact`, async ({page}) => {
  const ui: Record<string,string> = JSON.parse(readFileSync(`src/data/locales/${locale}.json`, 'utf8'));
  const content: Record<string,string> = JSON.parse(readFileSync(`src/data/locales/content/${locale}.json`, 'utf8'));
  const t = (key: string) => ui[key] || content[key];
  await page.setViewportSize({width: 390, height: 844});
  await page.goto(`/${locale}/btu-calculator`);
  await pick(page, 'calculation-mode', t('US room and building heat transfer'));
  await expect(page.locator('#us-design-state')).toContainText('Texas');
  await pick(page, 'us-design-state', 'Alaska');
  await pick(page, 'us-design-county', 'Fairbanks North Star');
  await calculate(page);
  await expect(page.locator('.primary-metric dt')).toHaveText(t('Steady heating load'));
  await expect(page.locator('.primary-metric dd')).not.toBeEmpty();
  await expect(page.locator('#calculation-table').getByRole('cell', {name: t('Opaque exterior walls'), exact: true})).toBeVisible();
  await expect(page.locator('#calculation-table').getByRole('columnheader', {name: t('Assembly U-value (W/m²·K)'), exact: true})).toContainText('(W/m²·K)');
  if (locale === 'es') {
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', {name: 'CSV', exact: true}).click();
    const csv = readFileSync((await (await downloaded).path())!, 'utf8');
    expect(csv).toContain(t('Opaque exterior walls'));
    // CSV follows the displayed two-decimal precision: 110 ft² = 10.2193344 m².
    expect(Number(csv.split(/\r?\n/)[1].split(',')[1].replaceAll('"', ''))).toBe(10.22);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
