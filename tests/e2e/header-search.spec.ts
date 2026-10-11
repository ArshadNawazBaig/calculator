import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('header search keeps suggestions inside one dialog and replaces popular links', async ({page}) => {
  await page.goto('/');
  const trigger = page.getByRole('button', {name: 'Search calculators', exact: true});
  await trigger.click();
  const dialog = page.getByRole('dialog', {name: 'Find a calculator'});
  const input = dialog.getByRole('combobox');
  await expect(dialog.getByText('Popular calculators', {exact: true})).toBeVisible();
  await input.fill('e');
  await expect(dialog.getByRole('option')).toHaveCount(5);
  await expect(dialog.getByText('Popular calculators', {exact: true})).toHaveCount(0);
  const resultsBottom = await dialog.getByRole('button', {name: 'View all results'}).evaluate(e => e.getBoundingClientRect().bottom);
  const dialogBottom = await dialog.evaluate(e => e.getBoundingClientRect().bottom);
  expect(resultsBottom).toBeLessThanOrEqual(dialogBottom);
  await input.press('Tab');
  await expect(dialog.getByRole('button', {name: 'Clear search'})).toBeFocused();
  await expect(dialog.getByRole('listbox')).toBeVisible();
  await dialog.getByRole('button', {name: 'Clear search'}).click();
  await expect(dialog.getByRole('listbox')).toHaveCount(0);
  await expect(dialog.getByText('Popular calculators', {exact: true})).toBeVisible();
  await input.fill('mortgage');
  const audit = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(audit.violations).toEqual([]);
  await input.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await input.fill('mortgage');
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/mortgage-calculator$/);
  await expect(dialog).toHaveCount(0);
});

for (const width of [320, 390]) test(`search dialog scrolls as one panel at ${width}px`, async ({page}) => {
  await page.setViewportSize({width, height: 480});
  await page.goto('/');
  await page.getByRole('button', {name: 'Search calculators', exact: true}).click();
  const dialog = page.getByRole('dialog', {name: 'Find a calculator'});
  const input = dialog.getByRole('combobox');
  await input.fill('e');
  await input.press('ArrowUp');
  await expect(dialog.getByRole('option').last()).toHaveAttribute('aria-selected', 'true');
  await expect(dialog.getByRole('option').last()).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // The list shares the dialog's scroll container rather than introducing a second one.
  expect(await dialog.getByRole('listbox').evaluate(e => e.scrollHeight <= e.clientHeight + 1)).toBe(true);
  await dialog.getByRole('button', {name: 'View all results'}).click();
  await expect(page).toHaveURL(/\/search\?q=e$/);
  await expect(dialog).toHaveCount(0);
});
