import {test,expect} from '@playwright/test';
import review from '../../docs/research/editorial/copy-review-2026-10-11.json';

test('publishes the authorized operator in every language',async({page})=>{
  const entry=review.entries.find(row=>row.source.startsWith('Finflo is operated by Erush'))!;
  for(const locale of ['en','es','fr','de','pt','ar','hi','tl'] as const) {
    await page.goto(`${locale==='en'?'':`/${locale}`}/about`);
    await expect(page.locator('main')).toContainText(locale==='en'?entry.source:entry.translations[locale]);
  }
});

test('keeps analytics inactive and calculator values out of the address',async({page})=>{
  const vendorRequests:string[]=[];
  page.on('request',request=>{if(/cloudflareinsights\.com/.test(request.url()))vendorRequests.push(request.url());});
  await page.goto('/compound-interest-calculator');
  await page.locator('#growth-initial').fill('1234');
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await expect(page.locator('.primary-metric dd')).toBeVisible();
  expect(new URL(page.url()).search).toBe('');
  await expect(page.locator('#finflo-web-analytics')).toHaveCount(0);
  expect(vendorRequests).toEqual([]);
  await page.goto('/privacy');
  await expect(page.locator('main')).toContainText('Finflo is hosted on Railway.');
  await expect(page.getByRole('heading',{name:'Page visits and performance',exact:true})).toHaveCount(0);
});

test('shows regional mortgage scope and keeps desktop downloads immediate',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/canadian-mortgage-calculator');
  await expect(page.getByRole('spinbutton',{name:'Amortization period years',exact:true})).toBeVisible();
  await expect(page.locator('main')).toContainText('renewal');
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'CSV',exact:true}).click();
  expect((await pending).suggestedFilename()).toBe('finflo-canadian-mortgage-calculator.csv');
  await expect(page.getByRole('link',{name:'Download file',exact:true})).toBeHidden();
});
