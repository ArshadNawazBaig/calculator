import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
