import {expect, test} from '@playwright/test';

test('elapsed time starts without subtracting an unrequested break', async ({page}) => {
  await page.goto('/time-duration-calculator');
  await expect(page.locator('#duration-break')).toHaveValue('0');
  await expect(page.locator('#calculation-summary .primary-metric dd')).toHaveText('08:30:00');
  await page.getByRole('spinbutton', {name: /^Break to subtract/}).fill('30');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('#calculation-summary .primary-metric dd')).toHaveText('08:00:00');
  await page.goto('/hours-calculator');
  await expect(page.locator('#duration-break')).toHaveValue('30');
});

test('scientific notation accepts displayed input formats and renders normalized equivalent forms', async ({page}) => {
  await page.setViewportSize({width: 360, height: 800});
  await page.goto('/scientific-notation-calculator#mode-arithmetic');
  await expect(page.locator('#arithmetic-a-hint')).toContainText('1.23 × 10^7');
  await page.locator('#arithmetic-a').fill('999.9');
  await page.locator('#arithmetic-b').fill('0');
  await page.locator('#arithmetic-digits').fill('3');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  const metric = (label: string) => page.locator('#calculation-summary .metric').filter({has: page.getByText(label, {exact: true})}).locator('dd');
  await expect(metric('Scientific notation')).toHaveText('1.00e+3');
  await expect(metric('Engineering notation')).toHaveText('1 × 10^3');
  await page.locator('#arithmetic-a').fill('2 × 10^30');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(metric('Decimal')).toHaveText('2000000000000000000000000000000');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
