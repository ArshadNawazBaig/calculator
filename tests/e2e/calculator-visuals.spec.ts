import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {captureIllustration} from './illustration-assertions';

test('capturing the volume cover preserves the save field through hydration', async ({page}) => {
  const errors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error' && /hydrat|didn.t match/i.test(message.text())) errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));

  let releaseScripts!: () => void;
  const ready = new Promise<void>(resolve => {releaseScripts = resolve;});
  await page.route('**/_next/static/**/*.js', async route => {await ready; await route.continue();});
  await page.goto('/volume-calculator', {waitUntil: 'commit'});
  const name = page.getByLabel('Calculation name', {exact: true});
  try {
    await expect(name).toBeDisabled();
    expect(await name.getAttribute('style')).toBeNull();
    const mutations = await name.evaluateHandle(input => {
      let count = 0;
      const observer = new MutationObserver(records => {count += records.length;});
      observer.observe(input, {attributes: true, attributeFilter: ['style']});
      return () => {observer.disconnect(); return count;};
    });
    const cover = page.locator('[data-calculator-visual] img');
    await cover.scrollIntoViewIfNeeded();
    await cover.evaluate(image => (image as HTMLImageElement).decode());
    await captureIllustration(cover);
    expect(await mutations.evaluate(stop => stop())).toBe(0);
    await mutations.dispose();
  } finally {
    releaseScripts();
  }

  await expect(name).toBeEnabled();
  await name.fill('Saved volume');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await page.getByRole('button', {name: 'Save calculation', exact: true}).click();
  await expect(page.getByText('Calculation saved on this device.', {exact: true})).toBeVisible();
  await page.goto('/workspace');
  await expect(page.getByRole('heading', {name: 'Saved volume', exact: true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('calculator images and share metadata appear in crawlable mobile HTML', async ({browser, request}) => {
  const context = await browser.newContext({javaScriptEnabled: false, viewport: {width: 390, height: 844}, userAgent: 'Googlebot'});
  const page = await context.newPage();
  for (const slug of ['age-calculator', 'mortgage-calculator', 'area-calculator', 'real-estate-calculator', 'volume-calculator']) {
    // Measure the styled, JavaScript-free layout. DOMContentLoaded can precede the first paint.
    const response = await page.goto('/' + slug, {waitUntil: 'load'});
    expect(response?.status()).toBe(200);
    const figure = page.locator('[data-calculator-visual]');
    const image = figure.getByRole('img');
    await expect(image).toHaveAttribute('src', `/illustrations/calculators/${slug}.webp`);
    await expect(image).toHaveAttribute('loading', 'lazy');
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(img => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0)).toBe(true);
    const rendition = new URL(await image.evaluate(img => (img as HTMLImageElement).currentSrc));
    expect(rendition.pathname).toBe('/_next/image');
    const source = rendition.searchParams.get('url');
    if (slug === 'volume-calculator') expect(source).toMatch(/\/_next\/static\/media\/volume-calculator[^/]*\.webp$/);
    else expect(source).toBe(`/illustrations/calculators/${slug}.webp`);
    const alt = await image.getAttribute('alt');
    expect(alt).toBeTruthy();
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `https://finflo.org/illustrations/calculators/${slug}-social.jpg`);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', alt!);
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute('content', alt!);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://finflo.org/${slug}`);
    if (slug === 'real-estate-calculator') await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /mortgage, affordability, refinancing, and property investment/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect((await request.get(`/illustrations/calculators/${slug}.webp`)).ok()).toBe(true);
    expect((await request.get(`/illustrations/calculators/${slug}-social.jpg`)).ok()).toBe(true);
  }
  await context.close();
});

test('localized visuals describe their symbols and remain accessible', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  for (const [path, description] of [
    ['/es/area-calculator', 'un cuadrado discontinuo; un triángulo y una regla'],
    ['/ar/bmi-calculator', 'ميزان ذو كفتين'],
  ]) {
    await page.goto(path);
    const figure = page.locator('[data-calculator-visual]');
    await expect(figure.getByRole('img')).toHaveAttribute('alt', new RegExp(description));
    await expect(figure.locator('figcaption')).not.toBeEmpty();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect((await new AxeBuilder({page}).include('[data-calculator-visual]').analyze()).violations).toEqual([]);
  }
  for (const [path, text] of [
    ['/hi/real-estate-calculator', 'होम लोन'],
    ['/tl/real-estate-calculator', 'mortgage'],
  ]) {
    await page.goto(path);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', new RegExp(text));
  }
});
