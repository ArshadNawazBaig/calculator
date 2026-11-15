import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('method guidance and formula links follow the selected calculation without clearing active inputs', async ({page}) => {
  await page.goto('/simple-interest-calculator');
  const guide = page.locator('#calculator-inputs [data-input-guide]');
  await guide.getByText('Formula and input guidance', {exact: true}).click();
  await expect(guide).toContainText('original principal');
  await page.locator('a[href="#mode-inverse"]').click();
  await expect(page.locator('#calculator-inputs')).toHaveAttribute('data-mode', 'inverse');
  await guide.getByText('Formula and input guidance', {exact: true}).click();
  await expect(guide).toContainText('Solve');
  const input = page.locator('#calculator-inputs input[type="number"]').first();
  await input.fill('123');
  await page.locator('#calculation-mode').click();
  await page.getByRole('option', {selected: true}).click();
  await expect(input).toHaveValue('123');
});

test('normal inverse fields identify probability scale and calculate the selected tail', async ({page}) => {
  await page.goto('/z-score-calculator#mode-normal-tails');
  await page.locator('#normal-tails-known').click();
  await page.getByRole('option', {name: 'Probability below', exact: true}).click();
  await page.getByRole('spinbutton', {name: /^Probability below/}).fill('0.975');
  await expect(page.locator('#normal-tails-value-hint')).toContainText('0.95 for 95%');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric')).toContainText('Z-score');
  await expect(page.locator('.primary-metric dd')).toHaveText('1.96');
});

test('the main answer matches standard deviation and nutrient calculator intent', async ({page}) => {
  for (const [slug, label] of [
    ['standard-deviation-calculator', 'Sample standard deviation'],
    ['carbohydrate-calculator', 'Carbohydrate'],
    ['fat-intake-calculator', 'Fat'],
  ]) {
    await page.goto(`/${slug}`);
    await expect(page.locator('.primary-metric dt')).toHaveText(label);
    await page.getByRole('button', {name: 'Calculate', exact: true}).click();
    await expect(page.locator('.primary-metric dt')).toHaveText(label);
  }
});

test('material diagrams follow shape inputs and preserve textual help for other geometry', async ({page}) => {
  await page.setViewportSize({width: 360, height: 800});
  await page.goto('/square-footage-calculator#mode-measured');
  const guide = page.locator('#calculator-inputs [data-input-guide]');
  await page.locator('#measured-shape').click();
  await page.getByRole('option', {name: 'circle', exact: true}).click();
  await expect(guide.getByRole('img')).toHaveAttribute('aria-label', /diameter d/);
  await page.locator('#measured-outerDiameter').fill('10');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toContainText('78.54');
  await page.goto('/concrete-calculator#mode-measured');
  await page.locator('#measured-shape').click();
  await page.getByRole('option', {name: 'Hollow column', exact: true}).click();
  await expect(guide.getByRole('img')).toHaveAttribute('aria-label', /outer diameter D, inner diameter d/);
  await page.locator('#measured-shape').click();
  await page.getByRole('option', {name: 'Curb and gutter', exact: true}).click();
  await expect(guide.getByRole('img')).toHaveCount(0);
  await guide.getByText('Formula and input guidance', {exact: true}).click();
  await expect(guide).toContainText('Ordered volume = net volume');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect((await new AxeBuilder({page}).include('.calculator-workspace').analyze()).violations).toEqual([]);
});

test('switching methods replaces shared-key dropdown IDs and options', async ({page}) => {
  await page.goto('/square-footage-calculator#mode-shapes');
  await page.locator('#shapes-shape').click();
  await page.getByRole('option', {name: 'Parallelogram: base a, perpendicular height b', exact: true}).click();
  await page.locator('a[href="#mode-measured"]').click();
  await expect(page.locator('#calculator-inputs')).toHaveAttribute('data-mode', 'measured');
  await expect(page.locator('#shapes-shape')).toHaveCount(0);
  await expect(page.locator('#measured-shape')).toHaveAttribute('aria-labelledby', /(?:^|\s)measured-shape-label(?:\s|$)/);
  await page.locator('#measured-shape').click();
  await page.getByRole('option', {name: 'circle', exact: true}).click();
  await expect(page.locator('#calculator-inputs [data-input-guide]')).toContainText('d / 2');
});
