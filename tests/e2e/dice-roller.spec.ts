import {expect, test, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const faces = (page: Page) => page.locator('[data-dice-result] [data-die]');
const faceValues = (page: Page) => faces(page).evaluateAll(elements => elements.map(element => Number(element.getAttribute('data-die-value'))));

async function expectRoll(page: Page, count: number, sides: number) {
  await expect(faces(page)).toHaveCount(count);
  const values = await faceValues(page);
  for (const [index, value] of values.entries()) {
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(sides);
    await expect(faces(page).nth(index)).toHaveAttribute('data-die-sides', String(sides));
    await expect(faces(page).nth(index).locator('[data-pip]')).toHaveCount(sides === 6 ? value : 0);
    await expect(faces(page).nth(index).locator('.sr-only')).toHaveText(`Die ${index + 1}: ${value}`);
  }
  await expect(page.locator('.primary-metric dd')).toHaveText(values.reduce((sum, value) => sum + value, 0).toLocaleString('en-US'));
  return values;
}

test.beforeEach(async ({page}) => {
  await page.route('https://pagead2.googlesyndication.com/**', route => route.abort());
  await page.goto('/dice-roller');
  await expect(page.locator('[data-calculator-submit]')).toBeEnabled();
});

test('dice cards update the count and sides without inventing an initial roll', async ({page}) => {
  await expect(page.locator('[data-dice-controls]')).toBeVisible();
  await expect(page.locator('[data-dice-preview] [data-die]')).toHaveCount(2);
  await expect(page.locator('[data-dice-preview] [data-die-value]')).toHaveCount(0);
  await expect(page.locator('[data-dice-result]')).toHaveCount(0);
  await expect(page.locator('[data-dice-count="2"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-dice-sides="6"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-dice-count="5"]').click();
  await expect(page.locator('#dice-count')).toHaveValue('5');
  await expect(page.locator('[data-dice-preview] [data-die]')).toHaveCount(5);
  await page.locator('[data-dice-sides="20"]').click();
  await expect(page.locator('#dice-sides')).toHaveValue('20');
  await expect(page.locator('[data-dice-preview] [data-die-sides="20"]')).toHaveCount(5);
  await expect(page.locator('[data-dice-preview] [data-die-value]')).toHaveCount(0);
  await expect(page.locator('[data-calculator-submit]')).toHaveText(/Roll dice/);
});

test('six-sided roll faces match each accessible value and the total', async ({page}) => {
  await page.locator('[data-dice-count="6"]').click();
  await page.locator('[data-calculator-submit]').click();
  const previous = await expectRoll(page, 6, 6);
  await page.locator('[data-dice-count="6"]').click();
  await page.locator('[data-dice-sides="6"]').click();
  await expect(page.locator('#calculation-summary')).not.toHaveAttribute('data-stale', 'true');
  expect(await faceValues(page)).toEqual(previous);
  await page.locator('[data-calculator-submit]').click();
  await expectRoll(page, 6, 6);
});

test('editing inputs keeps the previous rolled faces intact until another roll and reset clears them', async ({page}) => {
  await page.locator('[data-calculator-submit]').click();
  const previous = await expectRoll(page, 2, 6);
  await page.locator('[data-dice-count="3"]').click();
  await page.locator('[data-dice-sides="20"]').click();
  await expect(page.locator('#calculation-summary')).toHaveAttribute('data-stale', 'true');
  await expect(faces(page)).toHaveCount(2);
  expect(await faceValues(page)).toEqual(previous);
  await expect(faces(page).first()).toHaveAttribute('data-die-sides', '6');
  await page.locator('[data-calculator-submit]').click();
  await expectRoll(page, 3, 20);
  await expect(page.locator('#calculation-summary')).not.toHaveAttribute('data-stale', 'true');
  await page.getByRole('button', {name: 'Reset', exact: true}).click();
  await expect(page.locator('#dice-count')).toHaveValue('2');
  await expect(page.locator('#dice-sides')).toHaveValue('6');
  await expect(page.locator('[data-dice-result]')).toHaveCount(0);
  await expect(page.locator('[data-dice-preview] [data-die]')).toHaveCount(2);
  await expect(page.locator('[data-dice-preview] [data-die-value]')).toHaveCount(0);
});

test('custom inputs preserve the full 100-dice and 1000-side limits', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  await page.locator('#dice-count').fill('100');
  await page.locator('#dice-sides').fill('1000');
  await expect(page.locator('[data-dice-count][aria-pressed="true"]')).toHaveCount(0);
  await expect(page.locator('[data-dice-sides][aria-pressed="true"]')).toHaveCount(0);
  await expect(page.locator('[data-dice-preview] [data-die]')).toHaveCount(100);
  await page.locator('[data-calculator-submit]').click();
  await expectRoll(page, 100, 1000);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.locator('#dice-count').fill('');
  await expect(page.locator('[data-dice-preview] [data-die]')).toHaveCount(0);
  await page.locator('[data-calculator-submit]').click();
  expect(await page.locator('#dice-count').evaluate((element: HTMLInputElement) => element.validity.valueMissing)).toBe(true);
});

test('keyboard selection and mobile dice grids remain accessible at 320 pixels', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  const count = page.locator('[data-dice-count="4"]');
  await count.focus();
  await page.keyboard.press('Space');
  await expect(count).toHaveAttribute('aria-pressed', 'true');
  const sides = page.locator('[data-dice-sides="12"]');
  await sides.focus();
  await page.keyboard.press('Enter');
  await expect(sides).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-calculator-submit]').click();
  await expectRoll(page, 4, 12);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const accessibility = await new AxeBuilder({page})
    .include('[data-dice-controls]').include('[data-dice-result]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(accessibility.violations).toEqual([]);
});
