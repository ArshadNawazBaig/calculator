import {isPublishedLocale, splitLocale} from '../../src/lib/i18n/config';
import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {spinWheels, wheelHref} from '../../src/lib/spin-wheels/catalog';

test('wheel pages hydrate without warnings across server and browser trigonometry differences', async ({page}) => {
  const errors: string[] = [];
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type()) && /hydrat|didn.t match/i.test(message.text())) errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const {sin, cos} = Math;
    Math.sin = angle => sin(angle) + Number.EPSILON;
    Math.cos = angle => cos(angle) + Number.EPSILON;
  });
  const paths = [...spinWheels.map(wheel => wheelHref(wheel.slug)), '/ar/spin-wheels/activity-wheel', '/hi/spin-wheels/activity-wheel'];
  for (const path of paths) {
    if (!isPublishedLocale(splitLocale(path).locale)) continue;
    await page.goto(path);
    await expect(page.locator('#wheel-entries')).toBeEnabled();
    expect(errors, path).toEqual([]);
  }
});

test('wheel pages expose unique metadata, readable guides and structured data before JavaScript', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled: false, baseURL: process.env.TEST_URL || 'http://127.0.0.1:3000'});
  const page = await context.newPage();
  for (const wheel of spinWheels) {
    const response = await page.goto(wheelHref(wheel.slug));
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', {level: 1})).toHaveText(wheel.title);
    await expect(page).toHaveTitle(wheel.seoTitle.replace(' | Finflo', ''));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', wheel.description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://finflo.org${wheelHref(wheel.slug)}`);
    expect((await page.getByRole('article', {name: `${wheel.title} guide`, exact: true}).innerText()).split(/\s+/).length).toBeGreaterThan(600);
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(schemas.map(schema => JSON.parse(schema)['@type'])).toEqual(['WebApplication', 'BreadcrumbList', 'Article']);
  }
  await context.close();
});

test('spin, remove, empty validation and reset keep results consistent', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/spin-wheels/wheel-of-names');
  const entries = page.getByLabel('Names', {exact: true});
  await entries.fill('Alex\nSam\nJordan');
  await page.getByRole('button', {name: 'Spin the wheel', exact: true}).click();
  const result = page.locator('[data-wheel-result]');
  await expect(result).toBeVisible();
  const winner = (await result.textContent())!;
  const selected = Number(await result.getAttribute('data-result-index'));
  expect(['Alex', 'Sam', 'Jordan'][selected]).toBe(winner);
  const angle = await page.locator('svg[style*="rotate"]').evaluate(el => Number(el.getAttribute('style')?.match(/rotate\(([\d.]+)deg\)/)?.[1]));
  expect(Math.floor(((360 - angle % 360) % 360) / 120)).toBe(selected);
  await page.getByRole('button', {name: 'Remove picked entry'}).click();
  expect((await entries.inputValue()).split('\n')).not.toContain(winner);
  await expect(page.getByRole('heading', {name: 'Recent spins'}).locator('..').locator('..')).toContainText(winner);
  await entries.fill('Only option');
  await page.getByRole('button', {name: 'Spin the wheel', exact: true}).click();
  await expect(result).toHaveText('Only option');
  await page.getByRole('button', {name: 'Remove picked entry'}).click();
  await expect(page.getByRole('button', {name: 'Spin the wheel', exact: true})).toBeDisabled();
  await expect(page.locator('#wheel-entry-error')).toContainText('Add at least one entry');
  await page.getByRole('button', {name: 'Reset wheel'}).click();
  await expect(entries).toHaveValue(spinWheels.find(wheel => wheel.slug === 'wheel-of-names')!.entries.join('\n'));
  await expect(result).toHaveCount(0);
});

test('range presets, validation and custom color labels work', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/spin-wheels/number-picker-wheel');
  await page.getByRole('button', {name: '1–100', exact: true}).click();
  expect((await page.getByLabel('Numbers', {exact: true}).inputValue()).split('\n')).toHaveLength(100);
  await page.getByLabel('First number').fill('5');
  await page.getByLabel('Last number').fill('3');
  await page.getByRole('button', {name: 'Apply range'}).click();
  await expect(page.locator('#wheel-entry-error')).toContainText('at least the first');
  await page.getByLabel('First number').fill('-1');
  await page.getByLabel('Last number').fill('1');
  await page.getByRole('button', {name: 'Apply range'}).click();
  await expect(page.getByLabel('Numbers', {exact: true})).toHaveValue('-1\n0\n1');
  await page.goto('/spin-wheels/random-color-wheel');
  await page.getByLabel('Colors', {exact: true}).fill('Red');
  await page.getByRole('button', {name: 'Spin the wheel', exact: true}).click();
  await expect(page.locator('[data-wheel-result]')).toHaveText('Red');
  await expect(page.getByText('#EF4444', {exact: true})).toBeVisible();
  await page.getByLabel('Colors', {exact: true}).fill('constructor\n__proto__');
  await page.getByRole('button', {name: 'Spin the wheel', exact: true}).click();
  await expect(page.locator('[data-wheel-result]')).toBeVisible();
});

test('reset cancels an in-flight spin without publishing a stale result', async ({page}) => {
  await page.clock.install();
  await page.goto('/spin-wheels/spin-the-wheel');
  await page.getByRole('button', {name: 'Spin the wheel', exact: true}).click();
  await expect(page.getByLabel('Your choices', {exact: true})).toBeDisabled();
  await page.getByRole('button', {name: 'Reset wheel'}).click();
  await page.clock.fastForward(5000);
  await expect(page.locator('[data-wheel-result]')).toHaveCount(0);
  await expect(page.getByLabel('Your choices', {exact: true})).toBeEnabled();
  await expect(page.getByText('Your last 10 picks will appear here during this visit.')).toBeVisible();
});

test('wheel discovery works through navigation, category directory and search', async ({page}) => {
  await page.goto('/spin-wheels');
  await expect(page.locator('[data-calculator-card]')).toHaveCount(8);
  await page.getByRole('link', {name: 'Wheel of Names', exact: true}).first().click();
  await expect(page).toHaveURL(/\/spin-wheels\/wheel-of-names$/);
  await page.goto('/search?q=number+picker');
  await page.getByRole('link', {name: 'Number Picker Wheel', exact: true}).click();
  await expect(page).toHaveURL(/\/spin-wheels\/number-picker-wheel$/);
  await page.goto('/');
  await page.getByRole('combobox', {name: 'Search calculators'}).fill('what to eat');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/spin-wheels\/what-to-eat-wheel$/);
  await page.goto('/calculators');
  await expect(page.locator('#spin-wheels [data-calculator-card]')).toHaveCount(8);
});

for (const colorScheme of ['light', 'dark'] as const) test(`wheel accessibility and responsive layout in ${colorScheme}`, async ({page}) => {
  await page.emulateMedia({colorScheme, reducedMotion: 'reduce'});
  for (const width of [320, 390, 768, 1281, 1440]) {
    await page.setViewportSize({width, height: 900});
    await page.goto('/spin-wheels/wheel-of-names');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('button', {name: 'Spin the wheel', exact: true}).click();
  await expect(page.locator('[data-wheel-result]')).toBeVisible();
  const result = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
});
