import {test, expect} from '@playwright/test';

const priorityPages = [
  {slug: 'area-calculator', title: 'Area Calculator: Rectangle, Circle, Triangle & More', rows: 8, answer: 'How do I calculate area?'},
  {slug: 'ratio-calculator', title: 'Ratio Calculator: Simplify, Solve & Scale Ratios', rows: 7, answer: 'How do I simplify or solve a ratio?'},
  {slug: 'volume-calculator', title: 'Volume Calculator: Cylinder, Sphere, Cube & More', rows: 11, answer: 'How do I calculate volume?'},
];

for (const item of priorityPages) {
  test(`${item.slug} exposes useful references and metadata without JavaScript`, async ({browser, baseURL}) => {
    const context = await browser.newContext({javaScriptEnabled: false, baseURL});
    try {
      const page = await context.newPage();
      const response = await page.goto(`/${item.slug}`);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(item.title);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://finflo.org/${item.slug}`);
      await expect(page.getByRole('heading', {name: item.answer, exact: true})).toBeVisible();
      await expect(page.locator('#formula-reference tbody tr')).toHaveCount(item.rows);
      await expect(page.locator('#formula-reference caption')).toBeVisible();
      const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(value => JSON.parse(value));
      const app = schemas.find(value => value['@type'] === 'WebApplication');
      expect(app.inLanguage).toBe('en');
      expect(app.creator.name).toBe('Finflo');
      expect(app.featureList.length).toBeGreaterThan(1);
      expect(app).not.toHaveProperty('aggregateRating');
      await expect(page.locator('#calculator-inputs')).toBeVisible();
    } finally {
      await context.close();
    }
  });
}

test('mobile ratio calculator solves a missing term and keeps references within the viewport', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/ratio-calculator');
  await page.getByRole('button', {name: /What would you like to calculate/}).click();
  await page.getByRole('option', {name: 'Solve any proportion term', exact: true}).click();
  await page.locator('#all-proportions-A').fill('3');
  await page.locator('#all-proportions-B').fill('4');
  await page.locator('#all-proportions-C').fill('9');
  await page.getByRole('button', {name: 'Calculate', exact: true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('12');
  await page.locator('#formula-reference').scrollIntoViewIfNeeded();
  await expect(page.locator('#formula-scroll-hint')).toBeVisible();
  const width = await page.evaluate(() => ({viewport: innerWidth, document: document.documentElement.scrollWidth}));
  expect(width.document).toBeLessThanOrEqual(width.viewport + 1);
});

test('home exposes the priority math tools in ordinary crawlable links', async ({page}) => {
  await page.goto('/');
  for (const item of priorityPages) {
    await expect(page.locator(`section[aria-labelledby="everyday-tools-title"] a[href="/${item.slug}"]`)).toHaveCount(1);
  }
});

test('navigation replaces the previous page title, description and canonical', async ({page}) => {
  await page.goto('/calculators');
  for (const item of priorityPages) {
    await page.locator(`main a[href="/${item.slug}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`/${item.slug}$`));
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://finflo.org/${item.slug}`);
    await expect(page.locator('title')).toHaveCount(1);
    await expect(page).toHaveTitle(item.title);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await page.locator('header a[href="/calculators"]').click();
    await expect(page).toHaveURL(/\/calculators$/);
  }
});

test('immediate navigation on a slow device keeps one correct canonical and browser history', async ({page}) => {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', {rate: 4});
  try {
    await page.goto('/calculators', {waitUntil: 'load'});
    // Click as soon as the document loads; waiting for networkidle hid the original race.
    await Promise.all([
      page.waitForURL('**/final-exam-grade-calculator'),
      page.evaluate(() => document.querySelector<HTMLAnchorElement>('nav[aria-label="Student calculators"] a[href="/final-exam-grade-calculator"]')!.click()),
    ]);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://finflo.org/final-exam-grade-calculator');
    await expect(page.locator('title')).toHaveCount(1);
    await expect(page).toHaveTitle('Final Exam Grade Calculator: Required Score');
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('#final-current')).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/calculators$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://finflo.org/calculators');
  } finally {
    await session.send('Emulation.setCPUThrottlingRate', {rate: 1});
    await session.detach();
  }
});
