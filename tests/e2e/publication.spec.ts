import {test, expect} from '@playwright/test';
import {locales, publishedLocales, localizedPath, translator} from '../../src/lib/i18n/config';
import tlMessages from '../../src/data/locales/tl.json';
import hiMessages from '../../src/data/locales/hi.json';

const tl = translator(tlMessages), hi = translator(hiMessages);

test('every language serves its own content and missing routes return 404',async({request})=>{
  test.setTimeout(120_000);
  expect(publishedLocales).toEqual(locales);
  for(const locale of publishedLocales)for(const path of ['/', '/grade-calculator', '/volume-calculator', '/privacy', '/search?q=loan']){
    const response=await request.get(localizedPath(path,locale),{maxRedirects:0});
    expect(response.status(),`${locale}${path}`).toBe(200);
    expect(response.headers().location).toBeUndefined();
    expect(await response.text()).toContain(`lang="${locale}"`);
  }
  const missing=await request.get('/tl/this-calculator-does-not-exist');
  expect(missing.status()).toBe(404);
});

test('translated bookmarks preserve queries, mode fragments, and browser preferences',async({page})=>{
  await page.goto('/loan-calculator');
  await page.evaluate(()=>localStorage.setItem('finflo.preferences.v1',JSON.stringify({country:'CA',currency:'CAD'})));
  await page.goto('/tl/loan-calculator?source=bookmark#mode-deferred');
  const url=new URL(page.url());
  expect(url.pathname+url.search+url.hash).toBe('/tl/loan-calculator?source=bookmark#mode-deferred');
  await expect(page.locator('html')).toHaveAttribute('lang','tl');
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
  const href=await page.getByRole('link',{name:tl('Open calculation'),exact:true}).getAttribute('href');
  expect(href).toMatch(/^\/tl\/loan-calculator#saved=/);
  await page.goto(localizedPath(href!,'hi'));
  await expect(page.locator('#loan-principal')).toHaveValue('1200');
  await expect(page.getByText(hi('Saved inputs restored. Select Calculate for an updated result.'),{exact:true})).toBeVisible();
  await page.getByRole('button',{name:hi('Calculate'),exact:true}).click();
  await expect(page.locator('.primary-metric dd')).toContainText('100.00');
});

test('public navigation and sitemap only advertise published language versions',async({page,request})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Language: English',exact:true}).click();
  await expect(page.getByRole('navigation',{name:'Website language'}).getByRole('link')).toHaveCount(publishedLocales.length);
  await expect(page.locator('#preferred-country')).toBeVisible();
  await expect(page.locator('#preferred-currency')).toBeVisible();
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(publishedLocales.length+1);
  const response=await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const index = await response.text();
  const listed = await page.evaluate(xml => [...new DOMParser().parseFromString(xml, 'application/xml').querySelectorAll('sitemap > loc')].map(node => node.textContent), index);
  expect(listed).toEqual(publishedLocales.map(locale => `https://finflo.org/sitemap-${locale}.xml`));
  for (const [i, url] of listed.entries()) {
    const child = await request.get(new URL(url!).pathname);
    expect(child.status()).toBe(200);
    const xml = await child.text();
    expect(xml).toContain(`<loc>https://finflo.org${localizedPath('/mortgage-calculator', publishedLocales[i])}</loc>`);
    if (publishedLocales[i] === 'en') expect(xml).toContain('<loc>https://finflo.org/guides/comparing-discounts-and-percentage-changes</loc>');
  }
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
