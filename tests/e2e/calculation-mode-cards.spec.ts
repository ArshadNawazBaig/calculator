import {test, expect, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const retirementModes = [
  {id: 'target', title: 'Retirement savings target', field: 'spending', result: 'Estimated capital needed'},
  {id: 'save', title: 'Monthly savings needed', field: 'target', result: 'Monthly contribution needed'},
  {id: 'withdraw', title: 'Withdrawal amount', field: 'balance', result: 'Periodic withdrawal'},
  {id: 'longevity', title: 'How long will it last?', field: 'balance', result: 'Estimated duration'},
  {id: 'salary-growth', title: 'Salary growth & income-based retirement', field: 'currentAge', result: 'Retirement balance'},
] as const;

const picker = (page: Page) => page.locator('[data-calculation-mode-picker]');
const choice = (page: Page, id: string) => picker(page).locator(`[data-mode-choice="${id}"]`);

test.beforeEach(async ({page}) => {
  await page.route('https://pagead2.googlesyndication.com/**', route => route.abort());
});

test('server HTML exposes every mode choice before JavaScript makes the controls interactive', async ({browser, baseURL}) => {
  const context = await browser.newContext({javaScriptEnabled: false, baseURL});
  try {
    const page = await context.newPage();
    for (const [slug, count] of [['retirement-calculator', 5], ['conversion-calculator', 11], ['tax-calculator', 24]] as const) {
      await page.goto(`/${slug}`, {waitUntil: 'domcontentloaded'});
      const choices = picker(page).locator('[data-mode-choice]');
      await expect(picker(page).locator('legend')).toContainText('What would you like to calculate?');
      await expect(choices).toHaveCount(count);
      await expect(picker(page).locator('[aria-pressed="true"]')).toHaveCount(1);
      for (const button of await choices.all()) {
        await expect(button).toBeDisabled();
        await expect(button).toHaveAttribute('aria-controls', 'calculator-inputs');
        await expect(button.locator('svg').first()).toHaveAttribute('aria-hidden', 'true');
        expect((await button.innerText()).trim()).not.toBe('');
      }
      if (slug === 'retirement-calculator') {
        for (const mode of retirementModes) await expect(choice(page, mode.id)).toHaveText(mode.title);
      }
    }
  } finally {
    await context.close();
  }
});

test('each retirement card opens its inputs and calculates the matching result', async ({page}) => {
  await page.goto('/retirement-calculator');
  await expect(picker(page).locator('[data-mode-choice]')).toHaveCount(retirementModes.length);
  for (const mode of retirementModes) {
    await choice(page, mode.id).click();
    await expect(choice(page, mode.id)).toHaveAttribute('aria-pressed', 'true');
    await expect(picker(page).locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator('#calculator-inputs')).toHaveAttribute('data-mode', mode.id);
    await expect(page.locator(`#${mode.id}-${mode.field}`)).toBeVisible();
    await page.getByRole('button', {name: 'Calculate', exact: true}).click();
    await expect(page.locator('#calculation-summary .primary-metric dt')).toHaveText(mode.result);
    await expect(page.locator('#calculation-summary .primary-metric dd')).not.toHaveText('');
    await expect(page.locator('#calculator-inputs .form-error')).toHaveCount(0);
  }
  await expect(page).toHaveURL(/#mode-salary-growth$/);
});

test('reselecting a card preserves edits and a saved calculation restores the selected card', async ({page}) => {
  await page.goto('/retirement-calculator#mode-save');
  const selected = choice(page, 'save');
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#save-target').fill('12000');
  await page.locator('#save-balance').fill('0');
  await page.locator('#save-years').fill('1');
  await page.locator('#save-rate').fill('0');
  await selected.click();
  await expect(page.locator('#save-target')).toHaveValue('12000');
  await expect(page.locator('#save-balance')).toHaveValue('0');
  await expect(page.locator('#save-years')).toHaveValue('1');
  await expect(page.locator('#save-rate')).toHaveValue('0');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('#calculation-summary .primary-metric dd')).toHaveText('$1,000.00');
  await page.getByLabel('Calculation name', {exact: true}).fill('Monthly savings example');
  await page.getByRole('button', {name: 'Save calculation', exact: true}).click();
  await expect(page.getByText('Calculation saved on this device.', {exact: true})).toBeVisible();
  await page.goto('/workspace');
  await page.locator('[data-saved-calculation]').filter({has: page.getByRole('heading', {name: 'Monthly savings example', exact: true})})
    .getByRole('link', {name: 'Open calculation', exact: true}).click();
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await expect(picker(page).locator('[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.locator('#save-target')).toHaveValue('12000');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('#calculation-summary .primary-metric dd')).toHaveText('$1,000.00');
});

test('keyboard users can select visible cards without opening a menu', async ({page}) => {
  await page.goto('/retirement-calculator');
  const first = choice(page, 'target'), second = choice(page, 'save'), third = choice(page, 'withdraw');
  await expect(first).toBeEnabled();
  await first.focus();
  await page.keyboard.press('Tab');
  await expect(second).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await expect(second).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(third).toBeFocused();
  await page.keyboard.press('Space');
  await expect(third).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#calculator-inputs')).toHaveAttribute('data-mode', 'withdraw');
  expect((await new AxeBuilder({page}).include('.calculator-workspace').analyze()).violations).toEqual([]);
});

test('compact formula guidance opens accessibly without overflowing a narrow screen', async ({page}) => {
  await page.setViewportSize({width: 320, height: 900});
  await page.goto('/retirement-calculator');
  const guide = page.locator('#calculator-inputs [data-input-guide][data-compact]');
  for (const id of ['save', 'salary-growth']) {
    await choice(page, id).click();
    await expect(guide).not.toHaveAttribute('open');
    const summary = guide.locator('summary');
    await expect(summary).toHaveText('How it works');
    await expect(summary).toHaveAccessibleName('How it works: Formula and input guidance');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(guide).toHaveAttribute('open', '');
    await expect(guide.locator('p').first()).toHaveText(retirementModes.find(mode => mode.id === id)!.title);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect((await new AxeBuilder({page}).include('#calculator-inputs').analyze()).violations).toEqual([]);
  }
});

for (const width of [320, 1280]) {
  test(`mode cards keep complete labels and usable controls at ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height: 900});
    for (const [slug, count] of [
      ['retirement-calculator', 5], ['tax-calculator', 24], ['conversion-calculator', 11],
      ['pace-calculator', 7], ['percent-calculator', 7], ['date-calculator', 6],
    ] as const) {
      await page.goto(`/${slug}`, {waitUntil: 'domcontentloaded'});
      const buttons = picker(page).locator('[data-mode-choice]');
      await expect(buttons).toHaveCount(count);
      await expect(buttons.first()).toBeEnabled();
      const layout = await buttons.evaluateAll(elements => elements.map(element => {
        const box = element.getBoundingClientRect();
        return {
          text: element.textContent?.trim(),
          width: box.width,
          height: box.height,
          clipped: element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1,
        };
      }));
      for (const button of layout) {
        expect(button.text, slug).toBeTruthy();
        expect(button.width, `${slug}: ${button.text}`).toBeGreaterThanOrEqual(44);
        expect(button.height, `${slug}: ${button.text}`).toBeGreaterThanOrEqual(44);
        expect(button.clipped, `${slug}: ${button.text}`).toBe(false);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), slug).toBe(true);
      const last = buttons.last(), lastId = await last.getAttribute('data-mode-choice');
      await last.scrollIntoViewIfNeeded();
      await last.click();
      await expect(last).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#calculator-inputs')).toHaveAttribute('data-mode', lastId!);
      if (count > 8) {
        await picker(page).getByRole('link', {name: 'Your inputs', exact: true}).click();
        await expect(page.locator('#calculator-inputs')).toBeInViewport();
      }
    }
  });
}
