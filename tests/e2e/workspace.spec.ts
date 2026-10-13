import {test, expect, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function saveLoan(page: Page, name: string, principal: string) {
  await page.locator('#loan-principal').fill(principal);
  await page.locator('#loan-rate').fill('0');
  await page.locator('#loan-years').fill('1');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await page.getByLabel('Calculation name', {exact: true}).fill(name);
  await page.getByRole('button', {name: 'Save calculation', exact: true}).click();
  await expect(page.getByText('Calculation saved on this device.', {exact: true})).toBeVisible();
}

test('favorites, named results, comparisons, and restored inputs survive reloads', async ({page}) => {
  const errors: string[] = [];page.on('pageerror', error => errors.push(error.message));
  await page.goto('/loan-calculator');
  await expect(page.getByRole('button', {name: 'Save calculation', exact: true})).toBeDisabled();
  await page.getByRole('button', {name: 'Add Loan Calculator to favorites', exact: true}).click();
  await saveLoan(page, 'Small loan', '1200');
  await page.locator('#loan-principal').fill('2400');
  await expect(page.getByRole('button', {name: 'Save calculation', exact: true})).toBeDisabled();
  await saveLoan(page, 'Large loan', '2400');
  await page.goto('/workspace');
  await expect(page.getByRole('heading', {name: 'Small loan', exact: true})).toBeVisible();
  await expect(page.locator('[data-calculator-card="loan-calculator"]')).toBeVisible();
  await page.reload();
  const small = page.locator('[data-saved-calculation]').filter({has: page.getByRole('heading', {name: 'Small loan', exact: true})});
  const large = page.locator('[data-saved-calculation]').filter({has: page.getByRole('heading', {name: 'Large loan', exact: true})});
  await small.getByLabel('Compare', {exact: true}).check();
  await large.getByLabel('Compare', {exact: true}).check();
  const comparison = page.getByRole('region', {name: 'Scenario comparison', exact: true});
  await expect(comparison).toContainText('$100.00');
  await expect(comparison).toContainText('$200.00');
  await expect(comparison).toContainText('+$100.00');
  await expect(comparison.getByText('Baseline', {exact: true})).toBeVisible();
  await page.getByText('Compare inputs', {exact: true}).click();
  await expect(page.getByRole('region', {name: 'Input comparison', exact: true})).toContainText('1200');
  const smallId = await small.getAttribute('data-saved-calculation');
  const editing = page.locator(`[data-saved-calculation="${smallId}"]`);
  await small.getByRole('button', {name: 'Rename', exact: true}).click();
  await editing.getByLabel('Calculation name', {exact: true}).fill('Home project');
  await editing.getByRole('button', {name: 'Save name', exact: true}).click();
  const renamed = page.locator('[data-saved-calculation]').filter({has: page.getByRole('heading', {name: 'Home project', exact: true})});
  await renamed.getByRole('link', {name: 'Open calculation', exact: true}).click();
  await expect(page.locator('#loan-principal')).toHaveValue('1200');
  await expect(page.getByText('Saved inputs restored. Select Calculate for an updated result.', {exact: true})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Save calculation', exact: true})).toBeDisabled();
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('$100.00');
  expect(new URL(page.url()).search).toBe('');
  expect(errors).toEqual([]);
});

test('backup export and import recover data, and invalid imports never replace it', async ({page}) => {
  await page.goto('/loan-calculator');await saveLoan(page, 'Backup loan', '1200');
  await page.goto('/workspace');
  const download = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Export backup', exact: true}).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('finflo-workspace.json');
  const path = await file.path();expect(path).toBeTruthy();
  await page.getByRole('button', {name: 'Clear workspace', exact: true}).click();
  await page.getByRole('button', {name: 'Remove saved data', exact: true}).click();
  await expect(page.locator('[data-saved-calculation]')).toHaveCount(0);
  await page.locator('input[type=file]').setInputFiles(path!);
  await expect(page.locator('[data-saved-calculation]')).toHaveCount(1);
  await page.locator('input[type=file]').setInputFiles(path!);
  await expect(page.locator('[data-saved-calculation]')).toHaveCount(1);
  await page.locator('input[type=file]').setInputFiles({name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{"version": 5}')});
  await expect(page.getByRole('status')).toContainText('not a valid Finflo workspace backup');
  await expect(page.locator('[data-saved-calculation]')).toHaveCount(1);
  await page.getByRole('button', {name: 'Delete', exact: true}).click();
  await page.getByRole('button', {name: 'Cancel', exact: true}).click();
  await expect(page.locator('[data-saved-calculation]')).toHaveCount(1);
  await page.getByRole('button', {name: 'Delete', exact: true}).click();
  await page.getByRole('button', {name: 'Delete calculation', exact: true}).click();
  await page.reload();await expect(page.locator('[data-saved-calculation]')).toHaveCount(0);
});

test('favorites synchronize across tabs and blocked storage reports failure', async ({page, context}) => {
  await page.goto('/loan-calculator');
  const other = await context.newPage();await other.goto('/workspace');
  await page.getByRole('button', {name: 'Add Loan Calculator to favorites', exact: true}).click();
  await expect(other.locator('[data-calculator-card="loan-calculator"]')).toBeVisible();
  await other.getByRole('button', {name: 'Remove Loan Calculator from favorites', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Add Loan Calculator to favorites', exact: true})).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => {Storage.prototype.setItem = () => {throw new DOMException('Full', 'QuotaExceededError');};});
  await page.getByRole('button', {name: 'Add Loan Calculator to favorites', exact: true}).click();
  await expect(page.getByRole('alert').filter({hasText: 'Unable to save.'})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Add Loan Calculator to favorites', exact: true})).toHaveAttribute('aria-pressed', 'false');
});

test('mobile workspace is accessible and comparison scrolls inside its container', async ({page}) => {
  await page.goto('/loan-calculator');await saveLoan(page, 'Mobile A', '1200');await saveLoan(page, 'Mobile B', '2400');
  await page.setViewportSize({width: 360, height: 800});await page.goto('/workspace');
  for (const checkbox of await page.getByLabel('Compare', {exact: true}).all()) await checkbox.check();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const region = page.getByRole('region', {name: 'Scenario comparison', exact: true});
  expect(await region.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  const audit = await new AxeBuilder({page}).include('#main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations).toEqual([]);
  await page.goto('/ar/workspace');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', {level: 1})).not.toHaveText('My workspace');
  await expect(page.locator('[data-saved-calculation]')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('sensitive tools never offer to save their contents', async ({page}) => {
  await page.goto('/password-generator');
  await expect(page.getByRole('button', {name: 'Save calculation', exact: true})).toHaveCount(0);
  await expect(page.locator('#saved-calculation-name')).toHaveCount(0);
});

test('saved currency is restored and different currencies cannot be compared', async ({page}) => {
  await page.goto('/loan-calculator');await saveLoan(page, 'Dollar loan', '1200');
  await page.locator('#calculator-currency').click();await page.getByRole('option', {name: /^EUR ·/}).click();
  await saveLoan(page, 'Euro loan', '1200');
  await page.goto('/workspace');
  const dollar = page.locator('[data-saved-calculation]').filter({has: page.getByRole('heading', {name: 'Dollar loan', exact: true})});
  const euro = page.locator('[data-saved-calculation]').filter({has: page.getByRole('heading', {name: 'Euro loan', exact: true})});
  await dollar.getByLabel('Compare', {exact: true}).check();
  await euro.getByLabel('Compare', {exact: true}).click();
  await expect(euro.getByLabel('Compare', {exact: true})).not.toBeChecked();
  await expect(page.getByRole('status')).toContainText('same calculator, mode, and currency');
  await dollar.getByRole('link', {name: 'Open calculation', exact: true}).click();
  await expect(page.locator('#calculator-currency')).toContainText('USD');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('$100.00');
});

test('non-default calculator modes and expression answer context reopen correctly', async ({page}) => {
  await page.goto('/loan-calculator');
  await page.locator('#calculation-mode').click();
  const modes = page.getByRole('option');const modeName = await modes.nth(1).innerText();
  await modes.nth(1).click();
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await page.getByLabel('Calculation name', {exact: true}).fill('Other loan mode');
  await page.getByRole('button', {name: 'Save calculation', exact: true}).click();
  await page.goto('/workspace');
  await page.getByRole('link', {name: 'Open calculation', exact: true}).click();
  await expect(page.locator('#calculation-mode')).toContainText(modeName);
  await page.goto('/scientific-calculator');
  const expression = page.locator('input[id$="-expression"]');
  await expression.fill('2+3');await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expression.fill('Ans*2');await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('10');
  await page.getByLabel('Calculation name', {exact: true}).fill('Answer memory');
  await page.getByRole('button', {name: 'Save calculation', exact: true}).click();
  await page.goto('/workspace');
  await page.locator('[data-saved-calculation]').filter({has: page.getByRole('heading', {name: 'Answer memory', exact: true})}).getByRole('link', {name: 'Open calculation', exact: true}).click();
  await expect(expression).toHaveValue('Ans*2');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('10');
});
