import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const guides = [
  {
    slug: 'sharing-and-scaling-ratios',
    title: 'How to share a total in a ratio and scale a recipe',
    calculator: 'ratio-calculator',
    category: '/calculators/math',
    caption: 'Choose the calculation from the information you actually have',
    example: '$960',
    modeHref: '/ratio-calculator#mode-scale',
    mode: 'scale',
    field: '#scale-factor',
  },
  {
    slug: 'hourly-vs-salary-pay-comparison',
    title: 'Hourly vs Salary: Compare Pay, Hours and Unpaid Leave',
    calculator: 'salary-calculator',
    category: '/calculators/finance',
    caption: 'Same scheduled hours, different leave arrangements; all amounts are gross',
    example: '$58,800',
    modeHref: '/salary-calculator#mode-schedule-units',
    mode: 'schedule-units',
    field: '#schedule-units-salaryAmount',
  },
  {
    slug: 'compare-loan-offers-apr-fees',
    title: 'Compare Loan Offers: APR, Fees and Total Repayment',
    calculator: 'apr-calculator',
    category: '/calculators/finance',
    caption: 'Equal net cash and equal terms; payments and APRs rounded for display',
    example: '$313.35',
    modeHref: '/loan-calculator#mode-frequencies',
    mode: 'frequencies',
    field: '#frequencies-principal',
  },
  {
    slug: 'elapsed-time-breaks-and-decimal-hours',
    title: 'How to calculate elapsed time, breaks and decimal hours',
    calculator: 'time-duration-calculator',
    category: '/calculators/everyday',
    caption: 'One week of shifts, with the overnight shift assigned to its starting date',
    example: '38.75',
    modeHref: '/time-duration-calculator#mode-dated',
    mode: 'dated',
    field: '#dated-start',
  },
] as const;

test.beforeEach(async ({page}) => {
  await page.route('https://pagead2.googlesyndication.com/**', route => route.abort());
});

test.describe('crawlable practical guides', () => {
  test.use({javaScriptEnabled: false});

  for (const guide of guides) {
    test(`${guide.slug} is discoverable from its calculator and serves complete article HTML`, async ({page}) => {
      await page.goto(`/${guide.calculator}`, {waitUntil: 'domcontentloaded'});
      const href = `/guides/${guide.slug}`;
      const link = page.locator(`#related-guides a[href="${href}"]`);
      await expect(link).toHaveText(guide.title);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(guide.title);
      await expect(page).toHaveTitle(guide.title);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://finflo.org${href}`);
      const table = page.getByRole('table', {name: guide.caption, exact: true});
      await expect(table).toBeVisible();
      await expect(table).toContainText(guide.example);
      await expect(table.locator('th[scope="col"]').first()).toBeVisible();
      await expect(table.locator('th[scope="row"]').first()).toBeVisible();
      await expect(page.getByRole('navigation', {name: 'Calculators for this guide'}).locator(`a[href="/${guide.calculator}"]`)).toBeVisible();

      const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(value => JSON.parse(value));
      const articles = schemas.filter(value => value['@type'] === 'Article');
      expect(articles).toHaveLength(1);
      expect(articles[0]).toMatchObject({
        headline: guide.title,
        url: `https://finflo.org${href}`,
        mainEntityOfPage: `https://finflo.org${href}`,
        inLanguage: 'en',
        author: {name: 'Finflo'},
      });
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', articles[0].description);
    });
  }

  test('the guide hub links directly to all four articles without JavaScript', async ({page}) => {
    await page.goto('/guides', {waitUntil: 'domcontentloaded'});
    for (const guide of guides) {
      await expect(page.locator(`.guide-card h2 a[href="/guides/${guide.slug}"]`)).toHaveText(guide.title);
    }
    await page.locator(`.guide-card h2 a[href="/guides/${guides[0].slug}"]`).click();
    await expect(page.locator('h1')).toHaveText(guides[0].title);
  });

  test('calculator directories expose relevant guide links without JavaScript', async ({page}) => {
    for (const path of ['/calculators', ...new Set(guides.map(guide => guide.category))]) {
      await page.goto(path, {waitUntil: 'domcontentloaded'});
      for (const guide of guides.filter(guide => path === '/calculators' || guide.category === path)) {
        await expect(page.locator(`[data-directory-guides] a[href="/guides/${guide.slug}"]`)).toHaveText(guide.title);
      }
    }
  });
});

test('worked-example links open the specified calculator modes', async ({page}) => {
  for (const guide of guides) {
    await page.goto(`/guides/${guide.slug}`, {waitUntil: 'domcontentloaded'});
    await page.locator(`.document-body section a[href="${guide.modeHref}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`${guide.modeHref}$`));
    await expect(page.locator('#calculator-inputs')).toHaveAttribute('data-mode', guide.mode);
    await expect(page.locator(guide.field)).toBeVisible();
    if (guide.mode === 'scale') {
      await page.locator('#scale-a').fill('3');
      await page.locator('#scale-b').fill('5');
      await page.locator('#scale-factor').fill('120');
      await page.locator('[data-calculator-submit]').click();
      await expect(page.locator('.primary-metric dd')).toHaveText('360 : 600');
    }
  }
});

test('worked tables remain readable and accessible on a narrow screen', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  for (const guide of guides) {
    await page.goto(`/guides/${guide.slug}`, {waitUntil: 'domcontentloaded'});
    await expect(page.getByRole('table', {name: guide.caption, exact: true})).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), guide.slug).toBe(true);
    const accessibility = await new AxeBuilder({page}).include('main .document-body').analyze();
    expect(accessibility.violations, guide.slug).toEqual([]);
  }
});
