import {test, expect} from '@playwright/test';
import {definitionMap} from '../../src/lib/calculators/registry';

const mathPages = [
  {slug: 'area-calculator', title: 'Area Calculator: Rectangle, Circle, Triangle & More', rows: 9, answer: 'How to use the area calculator'},
  {slug: 'ratio-calculator', title: 'Ratio Calculator: Simplify Ratios & Solve Proportions', rows: 7, answer: 'How do I simplify or solve a ratio?'},
  {slug: 'volume-calculator', title: 'Volume Calculator for 11 Shapes | Box, Cylinder & Sphere', rows: 12, answer: 'How do I calculate volume?'},
];

const priorityPages = [
  ...mathPages,
  {slug: 'pregnancy-calculator', title: 'Pregnancy Calculator: Due Date & Gestational Age', rows: 5, answer: 'Which date should I enter in the pregnancy calculator?'},
  {slug: 'molecular-weight-calculator', title: 'Molecular Weight Calculator: Formula & Molar Mass', rows: 7, answer: 'How does the molecular weight calculator read a formula?'},
];

for (const item of priorityPages) {
  const keyword = item.slug.replaceAll('-', ' ');
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
      expect(app.featureList).toEqual(definitionMap.get(item.slug)!.modes.map(mode => mode.title));
      expect(app).not.toHaveProperty('aggregateRating');
      const phrase = new RegExp(`\\b${keyword}\\b`, 'gi');
      const description = await page.locator('head meta[name="description"]').getAttribute('content');
      expect(description?.match(phrase)).toHaveLength(1);
      const snippetWidth = await page.evaluate(text => {
        const canvas = document.createElement('canvas').getContext('2d')!;
        canvas.font = '14px Arial';
        return canvas.measureText(text!).width;
      }, description);
      expect(snippetWidth).toBeLessThanOrEqual(640);
      const introduction = await page.locator('[data-page-hero] p').first().innerText();
      expect(introduction.split(/\s+/).slice(0, 100).join(' ').match(phrase)).toBeTruthy();
      const paragraphs = await page.locator('main p:visible').allInnerTexts();
      expect((paragraphs.join(' ').match(phrase) || []).length).toBeGreaterThan(6);
      await expect(page.getByRole('heading', {level: 2, name: new RegExp(keyword, 'i')}).first()).toBeVisible();
      const author = page.locator('a[rel~="author"]');
      await expect(author).toHaveText('Finflo');
      await expect(author).toHaveAttribute('href', '/about');
      for (const colorScheme of ['light', 'dark'] as const) {
        await page.emulateMedia({colorScheme});
        await expect(author).toHaveCSS('color', 'rgb(213, 249, 21)');
      }
      await expect(page.locator('head meta[name="author"]')).toHaveAttribute('content', 'Finflo');
      const guide = schemas.find(value => value['@type'] === 'Article');
      expect(guide.author.name).toBe('Finflo');
      expect(guide.about['@id']).toBe(app['@id']);
      expect(guide.dateModified > guide.datePublished).toBe(true);
      for (const [date, property] of [[guide.datePublished, 'published_time'], [guide.dateModified, 'modified_time']]) {
        await expect(page.locator(`[data-page-hero] time[datetime="${date}"]`)).toBeVisible();
        await expect(page.locator(`head meta[property="article:${property}"]`)).toHaveAttribute('content', date);
      }
      const questions = page.locator('#common-questions details');
      const faq = schemas.find(value => value['@type'] === 'FAQPage');
      expect(faq.mainEntity).toEqual(await questions.evaluateAll(items => items.map(item => ({
        '@type': 'Question', name: item.querySelector('summary > span')!.textContent,
        acceptedAnswer: {'@type': 'Answer', text: item.querySelector('p')!.textContent},
      }))));
      await expect(page.locator('#calculator-inputs')).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test(`${item.slug} meets the content length and keyword density targets in its initial HTML`, async ({request, page}) => {
    const response = await request.get(`/${item.slug}`);
    await expect(response).toBeOK();
    const {exactUses, contentWords} = await page.evaluate(({html, keyword}) => {
      const {body} = new DOMParser().parseFromString(html, 'text/html');
      body.querySelectorAll([
        'header, nav, footer, aside, [role="navigation"], [role="banner"], [role="contentinfo"], .site-header, .site-footer',
        'script, style, noscript, template, svg, iframe, canvas, object',
      ].join(', ')).forEach(element => element.remove());
      // Keep adjacent content blocks and controls from merging into a single word.
      body.querySelectorAll([
        'p, div, li, ul, ol, h1, h2, h3, h4, h5, h6, td, th, tr, section, article, main',
        'br, a, button, label, blockquote, figcaption, dt, dd, option',
      ].join(', ')).forEach(element => element.append(' '));
      const text = body.textContent ?? '';
      return {
        exactUses: text.match(new RegExp(`(?<![\\p{L}\\p{N}])${keyword.split(' ').join('[\\s_-]+')}(?![\\p{L}\\p{N}])`, 'giu'))?.length ?? 0,
        contentWords: text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)?.length ?? 0,
      };
    }, {html: await response.text(), keyword});
    expect(contentWords).toBeGreaterThanOrEqual(3250);
    // The audit counts each word in the matched phrase toward the percentage.
    const densityPercent = (exactUses * keyword.split(' ').length / contentWords) * 100;
    expect(densityPercent).toBeGreaterThanOrEqual(0.58);
  });
}

test('mobile ratio calculator solves a missing term and keeps references within the viewport', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/ratio-calculator');
  await page.locator('#calculation-mode').getByRole('button', {name: 'Solve any proportion term', exact: true}).click();
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
  for (const item of mathPages) {
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
