import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
import {translator} from '../../src/lib/i18n/config';

test.beforeEach(async ({page}) => {
  // Third-party ads are outside these tool checks and can inject unrelated errors.
  await page.route('**/pagead2.googlesyndication.com/**', route => route.fulfill({contentType: 'application/javascript', body: ''}));
});

test('world clocks hydrate, use server time and retain saved cities', async ({page}) => {
  const errors: string[] = [];
  page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/time', route => route.fulfill({json: {timestamp: Date.parse('2026-01-01T00:30:00Z')}}));
  await page.goto('/time/asia-karachi');
  await expect(page.locator('[data-clock-source]')).toContainText('Synchronized');
  await expect(page.locator('[data-live-clock]')).toContainText('05:30:');
  await expect(page.locator('[data-clock-date]')).toContainText('January 1, 2026');
  await page.getByRole('button', {name: 'Save clock', exact: true}).click();
  await page.reload();
  await expect(page.getByRole('button', {name: 'Saved clock', exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Make default'}).click();
  await page.goto('/time');
  await expect(page.locator('[data-live-clock]')).toContainText('05:30:');
  await page.getByRole('button', {name: '12 hour', exact: true}).click();
  await expect(page.locator('[data-live-clock]')).toContainText('AM');
  expect(errors).toEqual([]);
});

test('server clock failures are visibly labeled', async ({page}) => {
  await page.route('**/api/time', route => route.abort());
  await page.goto('/time');
  await expect(page.locator('[data-clock-source]')).toContainText('Using your device clock');
  await expect(page.locator('[data-live-clock]')).toHaveText(/\d{2}:\d{2}:\d{2}/);
});

test('clock dropdown searches zones, updates dates, saves the choice and keeps city pages in sync', async ({page}) => {
  await page.route('**/api/time', route => route.fulfill({json: {timestamp: Date.parse('2026-01-01T00:30:00Z')}}));
  await page.goto('/time');
  await expect(page.locator('[data-clock-source]')).toContainText('Synchronized');
  const picker = page.locator('#clock-zone');
  await picker.click();
  const search = page.getByRole('combobox', {name: 'Search options', exact: true});
  await search.fill('Pakistan');
  await expect(page.getByRole('option', {name: 'Pakistan · Karachi · Asia/Karachi', exact: true})).toBeVisible();
  await search.fill('India');
  await expect(page.getByRole('option', {name: 'India · Kolkata · Asia/Kolkata', exact: true})).toBeVisible();
  await search.fill('Australia');
  await expect(page.getByRole('option', {name: 'Australia · Sydney · Australia/Sydney', exact: true})).toBeVisible();
  await expect(page.getByRole('option', {name: 'Australia · Perth · Australia/Perth', exact: true})).toBeVisible();
  await search.fill('America');
  await expect(page.getByRole('option', {name: 'United States · New York · America/New_York', exact: true})).toBeVisible();
  await search.fill('Honolulu');
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(picker).toContainText('Pacific/Honolulu');
  await expect(page.locator('[data-live-clock]')).toContainText('14:30:');
  await expect(page.locator('[data-clock-date]')).toContainText('December 31, 2025');
  await expect(page.getByRole('heading', {name: 'Today in Honolulu'})).toBeVisible();
  await expect(page.getByText('UTC−10:00', {exact: true}).first()).toBeVisible();
  await page.getByRole('button', {name: 'Save clock', exact: true}).click();
  await page.getByRole('button', {name: 'Make default'}).click();
  await page.reload();
  await expect(picker).toContainText('Pacific/Honolulu');
  await expect(page.getByRole('button', {name: 'Saved clock', exact: true})).toBeVisible();
  const localTime = await page.evaluate(() => new Intl.DateTimeFormat('en', {hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(Date.parse('2026-01-01T00:30:00Z')));
  await page.getByRole('button', {name: 'Use my time zone'}).click();
  await expect(page.locator('[data-live-clock]')).toContainText(localTime);

  await page.goto('/time/asia-karachi');
  await picker.click();
  await search.fill('Japan');
  await page.getByRole('option', {name: 'Japan · Tokyo · Asia/Tokyo', exact: true}).click();
  await expect(page).toHaveURL(/\/time\/asia-tokyo$/);
  await expect(page.getByRole('heading', {level: 1})).toHaveText('Current time in Tokyo');
  await expect(page.locator('[data-live-clock]')).toContainText('09:30:');
  await page.goBack();
  await expect(picker).toContainText('Asia/Karachi');
  await expect(page.locator('[data-live-clock]')).toContainText('05:30:');
});

test('timezone directory searches countries and aliases and filters regions', async ({page}) => {
  await page.goto('/time/time-zones');
  await page.getByLabel('Search time zones', {exact: true}).fill('Pakistan');
  await page.getByRole('link', {name: /Karachi.*Pakistan/}).click();
  await expect(page).toHaveURL(/\/time\/asia-karachi$/);
  await page.goto('/time/time-zones');
  await page.getByLabel('Search time zones', {exact: true}).fill('Calcutta');
  await expect(page.getByRole('link', {name: /Kolkata.*India/})).toBeVisible();
  await page.getByLabel('Search time zones', {exact: true}).fill('');
  await page.locator('#zone-region').click();
  await page.getByRole('option', {name: 'Europe', exact: true}).click();
  await expect(page.getByRole('link', {name: /Africa\/Abidjan/})).toHaveCount(0);
  await page.getByLabel('Search time zones', {exact: true}).fill('not-a-real-place');
  await expect(page.getByText('No time zones found. Try a city name or a shorter search.')).toBeVisible();
});

test('countdown validates, pauses, resumes, restores after reload, and catches up after a time jump', async ({page}) => {
  await page.clock.install();
  await page.goto('/time/timer');
  const display = page.locator('[data-timer-display]');
  await page.getByLabel('Minutes', {exact: true}).fill('0');
  await page.getByLabel('Seconds', {exact: true}).fill('0');
  await page.getByRole('button', {name: 'Start', exact: true}).click();
  await expect(page.locator('main [role="alert"]')).toContainText('Enter a duration');
  await page.getByLabel('Seconds', {exact: true}).fill('10');
  await page.getByRole('button', {name: 'Start', exact: true}).click();
  await page.clock.fastForward(3000);
  await page.getByRole('button', {name: 'Pause', exact: true}).click();
  const paused = await display.innerText();
  await page.clock.fastForward(20000);
  await expect(display).toHaveText(paused);
  await page.reload();
  await expect(display).toHaveText(paused);
  await page.getByRole('button', {name: 'Start', exact: true}).click();
  await page.clock.fastForward(60000);
  await expect(display).toHaveText('00:00:00');
  await expect(page.locator('[data-timer-status]')).toContainText('Time’s up!');
  await page.getByRole('button', {name: 'Reset', exact: true}).click();
  await expect(display).toHaveText('00:00:10');
  await page.getByRole('button', {name: 'Start', exact: true}).click();
  await page.clock.fastForward(11000);
  await page.getByLabel('Seconds', {exact: true}).fill('20');
  await expect(display).toHaveText('00:00:20');
  await expect(page.locator('[data-timer-status]')).not.toContainText('Time’s up!');
});

test('stopwatch excludes pauses and records lap splits', async ({page}) => {
  await page.clock.install();
  await page.goto('/time/stopwatch');
  await page.getByRole('button', {name: 'Start', exact: true}).click();
  await page.clock.fastForward(2000);
  await page.getByRole('button', {name: 'Lap', exact: true}).click();
  await page.clock.fastForward(1000);
  await page.getByRole('button', {name: 'Pause', exact: true}).click();
  const paused = await page.locator('[data-timer-display]').innerText();
  await page.clock.fastForward(10000);
  await expect(page.locator('[data-timer-display]')).toHaveText(paused);
  await page.getByRole('button', {name: 'Start', exact: true}).click();
  await page.clock.fastForward(1000);
  await page.getByRole('button', {name: 'Lap', exact: true}).click();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.getByRole('button', {name: 'Reset', exact: true}).click();
  await expect(page.locator('[data-timer-display]')).toHaveText('00:00:00.00');
  await expect(page.locator('tbody tr')).toHaveCount(0);
});

for (const theme of ['light','dark'] as const) test(`time tools remain accessible and fit small screens in ${theme}`, async ({page}) => {
  await page.emulateMedia({colorScheme: theme});
  for (const path of ['/time/asia-karachi', '/time/time-zones', '/time/timer', '/time/stopwatch']) {
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({width, height: 900});
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
    }
    const results = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    expect(results.violations, path).toEqual([]);
  }
});

test('time tools are discoverable from the homepage and navbar', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900});
  await page.goto('/');
  await page.getByRole('button', {name: 'Time & clocks', exact: true}).click();
  await expect(page.locator('#featured-calculators [data-calculator-card]')).toHaveCount(4);
  await page.locator('header').getByRole('link', {name: 'Time & clocks', exact: true}).click();
  await expect(page).toHaveURL(/\/time$/);
  await page.goto('/search?q=stopwatch');
  await page.getByRole('link', {name: 'Online Stopwatch', exact: true}).click();
  await expect(page).toHaveURL(/\/time\/stopwatch$/);
});

for (const locale of ['es','fr','de','pt','ar','hi','tl']) test(`time pages and controls are translated in ${locale}`, async ({page}) => {
  const messages = {...JSON.parse(await readFile(`src/data/locales/content/${locale}.json`, 'utf8')), ...JSON.parse(await readFile(`src/data/locales/${locale}.json`, 'utf8'))};
  const t = translator(messages);
  const errors: string[] = [];
  page.on('console', message => {if (message.type() === 'error' && /hydrat|didn.t match/i.test(message.text())) errors.push(message.text());});
  page.on('pageerror', error => errors.push(error.message));
  for (const [path,title] of [['/time','World Clock'], ['/time/time-zones','All Time Zones'], ['/time/timer','Online Timer'], ['/time/stopwatch','Online Stopwatch'], ['/time/asia-karachi','Current time in {place}']]) {
    await page.goto(`/${locale}${path}`);
    await expect(page.getByRole('heading', {level: 1})).toHaveText(t(title, {place: 'Karachi'}));
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://finflo.org/${locale}${path}`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
    if (/timer|stopwatch/.test(path)) await expect(page.getByRole('button', {name: t('Start'), exact: true})).toBeEnabled();
    else if (path.endsWith('time-zones')) await expect(page.getByLabel(t('Search time zones'), {exact: true})).toBeVisible();
    else await expect(page.locator('[data-live-clock]')).not.toHaveText('—:—:—');
    expect(errors, path).toEqual([]);
  }
});

test('server time is uncached and unknown timezone pages return 404', async ({request}) => {
  const before = Date.now(), response = await request.get('/api/time'), after = Date.now();
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toContain('no-store');
  const {timestamp} = await response.json();
  expect(timestamp).toBeGreaterThanOrEqual(before);
  expect(timestamp).toBeLessThanOrEqual(after);
  expect((await request.get('/time/not-a-real-zone')).status()).toBe(404);
  expect((await request.get('/ar/time/not-a-real-zone')).status()).toBe(404);
});

test('timezone search waits for hydration so early input is not lost', async ({page}) => {
  let release!: () => void;
  const ready = new Promise<void>(resolve => {release = resolve;});
  await page.route('**/_next/static/**/*.js', async route => {await ready; await route.continue();});
  try {
    await page.goto('/time/time-zones', {waitUntil: 'domcontentloaded'});
    await expect(page.locator('#zone-search')).toBeDisabled();
    release();
    await page.locator('#zone-search').fill('Karachi');
    await expect(page.locator('#zone-search')).toHaveValue('Karachi');
  } finally {release();}
});
