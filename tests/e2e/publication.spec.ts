import {test, expect} from '@playwright/test';
import {locales, publishedLocales, isPublishedLocale} from '../../src/lib/i18n/config';

const unpublished=locales.filter(locale=>!isPublishedLocale(locale));

test('unpublished language URLs temporarily reach the same English content',async({request})=>{
  for(const locale of unpublished)for(const path of ['', '/grade-calculator', '/volume-calculator', '/privacy', '/search?q=loan']){
    const response=await request.get(`/${locale}${path}`,{maxRedirects:0});
    expect(response.status(),`${locale}${path}`).toBe(307);
    expect(response.headers()['cache-control']).toContain('no-store');
    expect(response.headers()['x-robots-tag']).toContain('noindex');
    const location=new URL(response.headers().location,response.url());
    expect(location.pathname+location.search).toBe(path||'/');
  }
  const missing=await request.get('/tl/this-calculator-does-not-exist');
  expect(missing.status()).toBe(404);
});

test('language redirects preserve queries, mode fragments, and browser preferences',async({page})=>{
  await page.goto('/loan-calculator');
  await page.evaluate(()=>localStorage.setItem('finflo.preferences.v1',JSON.stringify({country:'CA',currency:'CAD'})));
  await page.goto('/tl/loan-calculator?source=bookmark#mode-deferred');
  const url=new URL(page.url());
  expect(url.pathname+url.search+url.hash).toBe('/loan-calculator?source=bookmark#mode-deferred');
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await expect(page.locator('#deferred-principal')).toBeVisible();
  await expect(page.locator('#calculator-currency')).toContainText('CAD');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('finflo.preferences.v1')!))).toEqual({country:'CA',currency:'CAD'});
});

test('saved calculations reopen from old translated bookmarks',async({page})=>{
  await page.goto('/loan-calculator');
  await page.locator('#loan-principal').fill('1200');
  await page.locator('#loan-rate').fill('0');
  await page.locator('#loan-years').fill('1');
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await page.getByLabel('Calculation name',{exact:true}).fill('Existing saved loan');
  await page.getByRole('button',{name:'Save calculation',exact:true}).click();
  await expect(page.getByText('Calculation saved on this device.',{exact:true})).toBeVisible();
  await page.goto('/tl/workspace');
  await expect(page.getByRole('heading',{name:'Existing saved loan',exact:true})).toBeVisible();
  const href=await page.getByRole('link',{name:'Open calculation',exact:true}).getAttribute('href');
  expect(href).toMatch(/^\/loan-calculator#saved=/);
  await page.goto(`/hi${href}`);
  await expect(page.locator('#loan-principal')).toHaveValue('1200');
  await expect(page.getByText('Saved inputs restored. Select Calculate for an updated result.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('$100.00');
});

test('public navigation and sitemap only advertise published language versions',async({page,request})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Language: English',exact:true}).click();
  await expect(page.getByRole('navigation',{name:'Website language'}).getByRole('link')).toHaveCount(publishedLocales.length);
  await expect(page.locator('#preferred-country')).toBeVisible();
  await expect(page.locator('#preferred-currency')).toBeVisible();
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  const response=await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const sitemap=await response.text();
  expect(sitemap).toContain('https://finflo.org/guides/comparing-discounts-and-percentage-changes');
  for(const locale of unpublished)expect(sitemap).not.toMatch(new RegExp(`https://finflo\\.org/${locale}(?:/|<)`));
});

test('privacy claims match the advertising behavior on published pages',async({page})=>{
  const advertising:string[]=[];
  page.on('request',request=>{if(/googlesyndication|doubleclick|adtrafficquality/.test(request.url()))advertising.push(request.url());});
  for(const path of ['/privacy','/cookies','/credit-card-calculator','/search?q=loan','/this-calculator-does-not-exist']){
    await page.goto(path);
    await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
    if(path==='/privacy')await expect(page.locator('main')).toContainText('loads no advertising networks');
  }
  expect(advertising).toEqual([]);
});
