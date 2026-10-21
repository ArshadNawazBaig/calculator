import {isPublishedLocale} from '../../src/lib/i18n/config';
import {test, expect, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {PDFDocument} from 'pdf-lib';
import {readFile} from 'node:fs/promises';

const tools = [
  ['freelance-rate-calculator','Freelance Rate Calculator','$91.67'],
  ['invoice-generator','Invoice & Quotation Generator','$750.00'],
  ['payment-fee-calculator','Payment Fee Calculator','$100.00'],
  ['break-even-calculator','Business Break-Even Calculator','100'],
  ['net-worth-tracker','Net Worth Tracker','$105,000.00'],
  ['emergency-fund-calculator','Emergency Fund Planner','$15,000.00'],
  ['subscription-cost-tracker','Subscription Cost Tracker','$45.00'],
  ['expense-splitter','Group Expense Splitter','$240.00'],
  ['cash-flow-calculator','Cash Flow & Runway Planner','-$13,200.00'],
  ['seller-profit-calculator','Online Seller Profit Calculator','$23.32'],
  ['solar-savings-calculator','Solar Savings Calculator','$15,000.00'],
  ['ev-vs-petrol-calculator','EV vs Petrol Cost Calculator','$32,000.00'],
];

async function calculate(page: Page) {
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await expect(page.locator('.calculator-results .eyebrow')).toHaveText('YOUR RESULT');
}

for (const [slug,title,primary] of tools) test(`${slug}: calculates with useful server-rendered guide and mobile layout`, async ({page,request}) => {
  const errors:string[]=[]; page.on('pageerror',error=>errors.push(error.message));
  const response=await request.get(`/${slug}`), html=await response.text();
  expect(response.status()).toBe(200); expect(html).toContain('quick-answer-heading'); expect(html).toContain('"@type":"Article"'); expect(html).toContain('id="common-questions"'); expect(html).toContain('id="understanding-4"');
  await page.setViewportSize({width:390,height:844}); await page.goto(`/${slug}`);
  await expect(page.getByRole('heading',{level:1,name:title,exact:true})).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',new RegExp(`/${slug}$`));
  await expect(page.locator('.primary-metric dd')).toHaveText(primary);
  await calculate(page);
  await expect(page.locator('.primary-metric dd')).toHaveText(primary);
  await expect(page.getByRole('button',{name:'Save calculation',exact:true})).toBeEnabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  expect(errors).toEqual([]);
});

test('invoice preserves client text, accepts branding, and downloads a multipage PDF',async({page})=>{
  await page.goto('/invoice-generator');
  await page.getByLabel('Business or freelancer name',{exact:true}).fill('Northwind Studio');
  await page.getByLabel('Customer name',{exact:true}).fill('Amina & Company');
  await page.getByLabel('Document number',{exact:true}).fill('TEST-014');
  await page.getByLabel('Discount on line-item subtotal',{exact:false}).fill('10');
  await page.getByLabel('Tax on discounted items',{exact:false}).fill('8');
  const items=page.locator('.record-editor').filter({has:page.locator('legend').filter({hasText:'Line items'})});
  const rows='description,quantity,rate\n'+Array.from({length:24},(_,i)=>`"Design phase ${i+1} — detailed delivery notes for the client",1,75`).join('\n');
  await items.locator('input[type=file]').setInputFiles({name:'items.csv',mimeType:'text/csv',buffer:Buffer.from(rows)});
  await expect(items.locator('.record-row')).toHaveCount(24);
  await calculate(page);
  const preview=page.getByRole('region',{name:'Invoice preview',exact:true});
  await expect(preview).toContainText('Northwind Studio'); await expect(preview).toContainText('Amina & Company');
  await preview.getByLabel('Logo (optional PNG or JPEG)').setInputFiles({name:'logo.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD1sAAAAASUVORK5CYII=','base64')});
  await expect(preview.getByAltText('Business logo')).toBeVisible();
  await preview.getByRole('button',{name:/Brand color/}).click();
  await page.getByRole('option',{name:'Dark green',exact:true}).click();
  await expect(preview.getByRole('button',{name:/Brand color/})).toContainText('Dark green');
  const downloading=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download invoice PDF',exact:true}).click();
  const file=await downloading; expect(file.suggestedFilename()).toBe('invoice-TEST-014.pdf');
  const pdf=await PDFDocument.load(await readFile((await file.path())!));
  expect(pdf.getPageCount()).toBeGreaterThan(1); expect(pdf.getTitle()).toBe('Northwind Studio');
  await preview.getByRole('button',{name:'Remove logo',exact:true}).click();
  await expect(preview.getByAltText('Business logo')).toHaveCount(0);
  await page.getByLabel('Customer name',{exact:true}).fill('Revised Client');
  await expect(page.getByRole('button',{name:'Download invoice PDF',exact:true})).toHaveCount(0);
});

test('net-worth snapshots survive reload and restore original inputs',async({page})=>{
  await page.goto('/net-worth-tracker'); await calculate(page);
  await page.getByLabel('Calculation name',{exact:true}).fill('October balance');
  await page.getByRole('button',{name:'Save calculation',exact:true}).click();
  const history=page.getByRole('region',{name:'Your net-worth history',exact:true});
  await expect(history).toContainText('October balance');
  await page.reload(); await expect(history).toContainText('$105,000.00');
  await history.getByRole('link',{name:'Restore October balance'}).click();
  await expect(page.getByText('Saved inputs restored. Select Calculate for an updated result.',{exact:true})).toBeVisible();
  await calculate(page); await expect(page.locator('.primary-metric dd')).toHaveText('$105,000.00');
});

test('cash-flow CSV import updates the forecast and invalid CSV preserves its rows',async({page})=>{
  await page.goto('/cash-flow-calculator');
  const rows=page.locator('.record-editor');
  await rows.locator('input[type=file]').setInputFiles({name:'movements.csv',mimeType:'text/csv',buffer:Buffer.from('month,description,direction,amount\n6,"Funding, committed",in,10000')});
  await expect(rows.locator('.record-row')).toHaveCount(1); await calculate(page);
  await expect(page.locator('.primary-metric dd')).toHaveText('-$3,200.00');
  await rows.locator('input[type=file]').setInputFiles({name:'invalid.csv',mimeType:'text/csv',buffer:Buffer.from('bad,headers\n1,2')});
  await expect(rows.getByRole('status')).toContainText('CSV headers must match'); await expect(rows.locator('.record-row')).toHaveCount(1);
});

test('group expense rows show exact settlements and export them',async({page})=>{
  await page.goto('/expense-splitter'); await calculate(page);
  const table=page.locator('#calculation-table');
  await expect(table).toContainText('Settlement'); await expect(table).toContainText('Sam'); await expect(table).toContainText('20.00');
  const downloading=page.waitForEvent('download'); await page.getByRole('button',{name:'CSV',exact:true}).click();
  const file=await downloading; const csv=await readFile((await file.path())!,'utf8');
  expect(csv).toContain('"Settlement","Sam","Alex"'); expect(csv).toContain('"Settlement","Jordan","Alex"');
});

test('toolkit tools retain the language selected in the directory',async({page})=>{
  test.skip(!isPublishedLocale('es'), 'This translation is not published.');
  await page.goto('/es/calculators/finance/other');
  const card=page.locator('[data-calculator-card="invoice-generator"]');
  await expect(card).toContainText('Generador de facturas y presupuestos');
  await expect(card.locator('a').first()).toHaveAttribute('href','/es/invoice-generator');
  await card.locator('a').first().click(); await expect(page).toHaveURL(/\/es\/invoice-generator$/);
});

for(const slug of ['invoice-generator','expense-splitter','net-worth-tracker']) test(`${slug}: keyboard labels and accessible content`,async({page})=>{
  await page.goto(`/${slug}`); await calculate(page);
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(audit.violations).toEqual([]);
});
