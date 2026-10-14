import {test, expect, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const key = 'finflo.theme.v1';
const background = (page: Page) => page.locator('body').evaluate(body => getComputedStyle(body).backgroundColor);
async function choose(page: Page, name: 'System' | 'Light' | 'Dark') {
  await page.getByRole('button', {name: 'Appearance', exact: true}).click();
  await page.getByRole('radio', {name, exact: true}).check();
  await page.keyboard.press('Escape');
}

test('defaults to the system and follows live device changes', async ({page}) => {
  await page.emulateMedia({colorScheme: 'light'});
  await page.goto('/');
  await expect.poll(() => background(page)).toBe('rgb(247, 248, 244)');
  await page.getByRole('button', {name: 'Appearance', exact: true}).click();
  await expect(page.getByRole('radio', {name: 'System', exact: true})).toBeChecked();
  await page.keyboard.press('Escape');
  await page.emulateMedia({colorScheme: 'dark'});
  await expect.poll(() => background(page)).toBe('rgb(16, 17, 19)');
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', '#101113');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
});

test('manual choices persist across reloads, routes, languages, and tabs', async ({page, context}) => {
  const hydrationErrors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error' && /hydrated|hydration|didn't match/i.test(message.text())) hydrationErrors.push(message.text());
  });
  await page.setViewportSize({width: 1440, height: 900});
  await page.emulateMedia({colorScheme: 'light'});
  await page.goto('/');
  await choose(page, 'Dark');
  await page.reload();
  await expect.poll(() => background(page)).toBe('rgb(16, 17, 19)');
  await page.getByRole('navigation', {name: 'Main navigation'}).getByRole('link', {name: 'Calculators', exact: true}).click();
  await expect(page).toHaveURL(/\/calculators$/);
  await expect.poll(() => background(page)).toBe('rgb(16, 17, 19)');
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', '#101113');
  const other = await context.newPage();
  await other.goto('/ar');
  await expect.poll(() => background(other)).toBe('rgb(16, 17, 19)');
  await choose(page, 'Light');
  await expect.poll(() => background(other)).toBe('rgb(247, 248, 244)');
  await page.emulateMedia({colorScheme: 'dark'});
  await expect.poll(() => background(page)).toBe('rgb(247, 248, 244)');
  await choose(page, 'System');
  await expect.poll(() => background(page)).toBe('rgb(16, 17, 19)');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
  expect(hydrationErrors).toEqual([]);
});

test('saved preference applies before hydration and storage failure remains usable', async ({page}) => {
  await page.emulateMedia({colorScheme: 'light'});
  await page.addInitScript(key => localStorage.setItem(key, 'dark'), key);
  // The bootstrap works even when React's scripts cannot load.
  await page.route('**/_next/**/*.js*', route => route.abort());
  await page.goto('/');
  await expect.poll(() => background(page)).toBe('rgb(16, 17, 19)');
  await page.unroute('**/_next/**/*.js*');
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {get() { throw new Error('Storage unavailable'); }});
  });
  await page.reload();
  await expect.poll(() => background(page)).toBe('rgb(247, 248, 244)');
  await choose(page, 'Dark');
  await expect.poll(() => background(page)).toBe('rgb(16, 17, 19)');
  await choose(page, 'System');
  await expect.poll(() => background(page)).toBe('rgb(247, 248, 244)');
});

test('invalid stored preferences fall back to the system without hydration errors', async ({page}) => {
  const errors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error' && /hydrated|hydration|didn't match/i.test(message.text())) errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(key => localStorage.setItem(key, 'invalid'), key);
  await page.emulateMedia({colorScheme: 'dark'});
  await page.goto('/');
  await expect.poll(() => background(page)).toBe('rgb(16, 17, 19)');
  await choose(page, 'Light');
  await page.reload();
  await expect(page.getByRole('button', {name: 'Appearance', exact: true})).toBeEnabled();
  expect(errors).toEqual([]);
});

for (const colorScheme of ['light', 'dark'] as const) test(`${colorScheme} theme is accessible and fits mobile headers`, async ({page}) => {
  await page.emulateMedia({colorScheme});
  for (const width of [320, 390, 1280, 1440]) {
    await page.setViewportSize({width, height: 900});
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const buttons = await page.locator('header button:visible').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect(); return {left: rect.left, right: rect.right};
    }));
    for (let i = 1; i < buttons.length; i++) expect(buttons[i].left).toBeGreaterThanOrEqual(buttons[i - 1].right);
  }
  await page.getByRole('button', {name: 'Appearance', exact: true}).click();
  const result = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole('radio', {name: 'System', exact: true}).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', {name: 'Light', exact: true})).toBeChecked();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', {name: 'Appearance', exact: true})).toBeFocused();
  await page.goto('/loan-calculator');
  await choose(page, colorScheme === 'dark' ? 'Dark' : 'Light');
  const calculator = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(calculator.violations).toEqual([]);
  await page.emulateMedia({media: 'print'});
  await expect.poll(() => background(page)).toBe('rgb(255, 255, 255)');
});
