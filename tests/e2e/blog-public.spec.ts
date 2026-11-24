import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('blog article cards', () => {
  test.use({javaScriptEnabled: false});

  test('aligns the read buttons in each row and opens the selected article by keyboard', async ({page}) => {
    await page.goto('/blog');
    const cards = page.locator('main article').filter({has: page.locator('h2 a[href^="/blog/"]')});
    const count = await cards.count();
    test.skip(count === 0, 'This check needs a published article.');
    const buttons = cards.getByRole('button', {name: /^Read article\b/});
    await expect(buttons).toHaveCount(count);

    for (const width of [1440, 860, 375]) {
      await page.setViewportSize({width, height: 900});
      const positions = await buttons.evaluateAll(elements => elements.map(button => {
        const card = button.closest('article')!;
        const style = getComputedStyle(card);
        const box = card.getBoundingClientRect();
        const bottom = button.getBoundingClientRect().bottom;
        return {row: box.top, bottom, expected: box.bottom - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingBottom)};
      }));
      const rows = new Map<number, number>();
      for (const {row, bottom, expected} of positions) {
        expect(bottom).toBeCloseTo(expected, 0);
        expect(bottom).toBeCloseTo(rows.get(row) ?? bottom, 0);
        rows.set(row, bottom);
      }
    }

    const titleLink = cards.first().locator('h2 a');
    const path = await titleLink.getAttribute('href');
    const title = await titleLink.innerText();
    await buttons.first().focus();
    await page.keyboard.press('Space');
    await expect(page).toHaveURL(url => url.pathname === path);
    await expect(page.getByRole('heading', {level: 1, name: title, exact: true})).toBeVisible();
  });
});

test('pins related calculators while scrolling the article with the wheel over a card', async ({page}) => {
  await page.goto('/blog');
  const articleLink = page.locator('main article h2 a[href^="/blog/"]').first();
  test.skip(await articleLink.count() === 0, 'The blog needs a published article for this reading-layout check.');
  const errors: string[] = [];
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type()) && /hydrat|didn.t match/i.test(message.text())) errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  await articleLink.click();
  const sidebar = page.getByRole('complementary', {name: /^(Related|Featured) calculators$/});
  await sidebar.waitFor();
  await page.evaluate(async () => {
    // Give short posts room to scroll while preserving the server-rendered markup.
    const sheet = new CSSStyleSheet();
    sheet.replaceSync('[data-blog-markdown] { min-height: 2400px; }');
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    await document.fonts.ready;
  });

  for (const viewport of [{width: 1440, height: 857}, {width: 860, height: 740}, {width: 720, height: 530}]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
    const article = await page.locator('article[aria-labelledby="page-title"]').boundingBox();
    const start = await sidebar.boundingBox();
    expect(start!.x).toBeGreaterThan(article!.x + article!.width);
    expect(start!.y).toBeCloseTo(article!.y, 0);

    await page.evaluate(y => window.scrollTo({top: y, behavior: 'instant'}), start!.y + start!.height);
    await expect.poll(async () => {
      const box = await sidebar.boundingBox();
      return viewport.height - (box!.y + box!.height);
    }).toBeCloseTo(16, 0);
    const pinned = await sidebar.boundingBox();
    expect(pinned!.y).toBeLessThanOrEqual(24);
    expect(await sidebar.locator('.related-card-grid').evaluate(list => list.scrollHeight - list.clientHeight)).toBeLessThanOrEqual(1);
    const card = await sidebar.getByRole('link').last().boundingBox();
    expect(card!.y).toBeGreaterThanOrEqual(0);
    expect(card!.y + card!.height).toBeLessThanOrEqual(viewport.height);

    await page.mouse.move(card!.x + card!.width / 2, card!.y + card!.height / 2);
    const before = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 250);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 240);
    expect((await sidebar.boundingBox())!.y).toBeCloseTo(pinned!.y, 0);

    await page.mouse.wheel(0, -Math.ceil(pinned!.height));
    await expect.poll(async () => (await sidebar.boundingBox())!.y).toBeCloseTo(16, 0);
    await page.evaluate(() => window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'instant'}));
    const end = await sidebar.getByRole('link').last().boundingBox();
    const footer = await page.locator('footer.site-footer').boundingBox();
    expect(end!.y + end!.height).toBeLessThanOrEqual(footer!.y);
  }
  expect(errors).toEqual([]);
});

test('blog has real content or useful existing guides, accessible mobile navigation and safe metadata',async({page})=>{
  await page.setViewportSize({width:360,height:844});
  const response=await page.goto('/blog');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading',{level:1})).toHaveCount(1);
  await expect(page.getByRole('navigation',{name:'Article topics'}).getByRole('link')).toHaveCount(6);
  const articles=page.locator('main article h2 a[href^="/blog/"]');
  if (await articles.count()===0) {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
    await expect(page.locator('main a[href="/guides/understanding-mortgage-payments"]').first()).toBeVisible();
    await expect(page.locator('main')).not.toContainText(/under construction|coming soon/i);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect((await new AxeBuilder({page}).include('main').analyze()).violations).toEqual([]);
  await page.getByRole('button',{name:'Open navigation',exact:true}).click();
  await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Blog',exact:true}).click();
  await expect(page).toHaveURL(/\/blog$/);
  await page.getByRole('navigation',{name:'Article topics'}).getByRole('link',{name:'All topics',exact:true}).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('navigation',{name:'Article topics'}).getByRole('link',{name:'Finance',exact:true})).toBeFocused();
});

test('blog filters render without JavaScript and nonexistent articles stay unavailable',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:360,height:844}});
  const page=await context.newPage();
  try {
    const response=await page.goto('/blog?category=Finance');
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
    await expect(page.getByRole('navigation',{name:'Article topics'}).getByRole('link',{name:'Finance',exact:true})).toHaveAttribute('aria-current','page');
    await page.getByRole('navigation',{name:'Article topics'}).getByRole('link',{name:'Health',exact:true}).click();
    await expect(page).toHaveURL(/category=Health/);
    const missing=await page.goto('/blog/finflo-nonexistent-private-article-test-9d2a6b');
    expect(missing?.status()).toBe(404);
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content',/noindex/);
  } finally {await context.close();}
});

test('private administration redirects anonymous readers without exposing an editor',async({page,request})=>{
  const response=await request.get('/admin/posts/new',{maxRedirects:0});
  expect([303,307]).toContain(response.status());
  expect(new URL(response.headers().location,response.url()).pathname).toBe('/admin/sign-in');
  expect(response.headers()['x-robots-tag']).toContain('noindex');
  await page.goto('/admin/posts/new');
  await expect(page).toHaveURL(/\/admin\/sign-in$/);
  await expect(page.locator('textarea[name="content"]')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content',/noindex/);
});

test('configured administrator login stays disabled until its POST handler hydrates',async({page})=>{
  test.skip(process.env.FINFLO_BLOG_E2E!=='1','Requires the explicitly configured private test deployment.');
  let release:()=>void=()=>{};
  const held=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/_next/static/**/*.js',async route=>{await held;await route.continue();});
  await page.goto('/admin/sign-in',{waitUntil:'commit'});
  const form=page.locator('form').filter({has:page.locator('input[name="password"]')});
  try {
    await expect(form).toHaveAttribute('method','post');
    await expect(page.getByLabel('Email address',{exact:true})).toBeDisabled();
    await expect(page.getByLabel('Password',{exact:true})).toBeDisabled();
    await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeDisabled();
  } finally {release();}
  await expect(page.getByLabel('Email address',{exact:true})).toBeEnabled();
  await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeEnabled();
});
