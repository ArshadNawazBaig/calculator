import {test, expect, type Page} from '@playwright/test';

async function pageGeometry(page: Page) {
  return page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    padding: getComputedStyle(document.documentElement).paddingInlineEnd,
    scroll: window.scrollY,
  }));
}

async function expectPageUnchanged(page: Page, before: Awaited<ReturnType<typeof pageGeometry>>) {
  expect(await pageGeometry(page)).toEqual(before);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).not.toMatch(/hidden|clip/);
}

for (const locale of ['en', 'ar']) test(`${locale}: dropdowns and nested preferences keep the page scrollbar`, async ({page}) => {
  const prefix = locale === 'en' ? '' : '/ar';
  await page.goto(`${prefix}/loan-calculator`);
  const mode = page.locator('#calculation-mode');
  await expect(mode).toBeEnabled();
  await mode.scrollIntoViewIfNeeded();
  const before = await pageGeometry(page);
  await mode.click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await expectPageUnchanged(page, before);
  await page.keyboard.press('Escape');
  await expect(mode).toBeFocused();

  await page.evaluate(() => window.scrollTo(0, 0));
  const headerBefore = await pageGeometry(page);
  const language = page.getByRole('button', {name: locale === 'en' ? 'Language: English' : 'اللغة: العربية'});
  await language.click();
  await expect(page.locator('#preferred-country')).toBeVisible();
  await expectPageUnchanged(page, headerBefore);
  await page.locator('#preferred-country').click();
  await expect(page.locator('[data-anchored-popover] input[role="combobox"]')).toBeVisible();
  await expect(page.locator('[data-anchored-popover][data-trigger="Select"]')).toHaveCSS('opacity', '1');
  await expectPageUnchanged(page, headerBefore);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(page.locator('#preferred-country')).toBeFocused();
  await page.locator('#preferred-currency').click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await expectPageUnchanged(page, headerBefore);
  await page.mouse.click(10, 250);
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(page.locator('#preferred-country')).toBeVisible();
  await page.mouse.click(10, 250);
  await expect(page.locator('#preferred-country')).toHaveCount(0);
  await expectPageUnchanged(page, headerBefore);
});

test('calendar and its year menu preserve scrolling and dismiss in order', async ({page}) => {
  await page.goto('/age-calculator');
  await expect(page.locator('.calculator-form button[type=submit]')).toBeEnabled();
  const calendar = page.getByRole('button', {name: 'Open calendar Date of birth', exact: true});
  await calendar.scrollIntoViewIfNeeded();
  const before = await pageGeometry(page);
  await calendar.click();
  await expect(page.getByRole('grid')).toBeVisible();
  await expectPageUnchanged(page, before);
  await page.getByRole('button', {name: '1995 year'}).click();
  await expect(page.getByRole('combobox', {name: 'Search options'})).toBeVisible();
  await expectPageUnchanged(page, before);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('grid')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(calendar).toBeFocused();
  await expectPageUnchanged(page, before);
});

test('page scrolling dismisses a dropdown while full search remains modal', async ({page}) => {
  await page.goto('/loan-calculator');
  const mode = page.locator('#calculation-mode');
  await expect(mode).toBeEnabled();
  await mode.click();
  await expect(page.getByRole('listbox')).toBeVisible();
  const before = await pageGeometry(page);
  await page.mouse.move(10, 400);
  await page.mouse.wheel(0, 250);
  await expect.poll(async () => (await pageGeometry(page)).scroll).toBeGreaterThan(before.scroll);
  await expect(page.getByRole('listbox')).toHaveCount(0);

  await page.getByRole('button', {name: 'Search calculators', exact: true}).click();
  await expect(page.getByRole('dialog', {name: 'Find a calculator'})).toBeVisible();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).toBe('hidden');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).not.toMatch(/hidden|clip/);
});
