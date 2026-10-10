import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';

async function selectCurrency(page:Page,code:string,id='calculator-currency') {
  await page.locator('#'+id).click();
  await page.getByRole('option',{name:new RegExp('^'+code+' ·')}).click();
}

test('country suggests a currency, manual override persists across reloads and languages',async({page})=>{
  await page.goto('/loan-calculator');
  await page.getByRole('button',{name:'Language: English'}).click();
  await page.locator('#preferred-country').click();
  await page.getByRole('option',{name:'Canada',exact:true}).click();
  await expect(page.locator('#preferred-currency')).toContainText('CAD');
  await selectCurrency(page,'EUR','preferred-currency');
  await page.keyboard.press('Escape');
  await expect(page.locator('#calculator-currency')).toContainText('EUR');
  await expect(page.locator('label[for="loan-principal"]')).toContainText('EUR');
  await page.reload();
  await expect(page.locator('#calculator-currency')).toContainText('EUR');
  await page.getByRole('button',{name:'Language: English'}).click();
  await page.getByRole('link',{name:'Français',exact:true}).click();
  await expect(page.locator('#calculator-currency')).toContainText('EUR');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('finflo.preferences.v1')!))).toEqual({country:'CA',currency:'EUR'});
  await page.getByRole('button',{name:'Langue : Français'}).click();
  await page.getByRole('button',{name:'Utiliser les valeurs par défaut de la langue'}).click();
  expect(await page.evaluate(()=>localStorage.getItem('finflo.preferences.v1'))).toBeNull();
  await page.getByRole('link',{name:'Português',exact:true}).click();
  await expect(page.locator('#calculator-currency')).toContainText('BRL');
});

test('currency changes preserve inputs and calculations and label table and CSV currency',async({page})=>{
  await page.goto('/loan-calculator');
  await page.locator('#loan-principal').fill('1000');
  await page.locator('#loan-rate').fill('0');
  await page.locator('#loan-years').fill('1');
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('$83.33');
  await selectCurrency(page,'EUR');
  await expect(page.locator('#loan-principal')).toHaveValue('1000');
  await expect(page.locator('.primary-metric dd')).toHaveText('€83.33');
  await expect(page.locator('[data-calculator-currency]')).toContainText('no exchange rate is applied');
  await expect(page.locator('.result-details table')).toBeVisible();
  await expect(page.getByRole('columnheader',{name:'Payment amount (EUR)',exact:true})).toBeVisible();
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'CSV',exact:true}).click();
  const download=await pending;
  const csv=await readFile((await download.path())!,'utf8');
  expect(csv).toContain('"Currency","EUR"');
  expect(csv).toContain('Payment amount (EUR)');
  expect(csv).not.toContain('Payment amount ($)');
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await expect(page.locator('#calculator-currency')).toContainText('EUR');
});

test('regional tools keep their rules and currencies despite preferences',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('finflo.preferences.v1',JSON.stringify({country:'AE',currency:'AED'})));
  for(const [slug,currency] of [['tax-calculator','USD'],['401k-calculator','USD'],['canadian-mortgage-calculator','CAD'],['mortgage-calculator-uk','GBP']]){
    await page.goto('/'+slug);
    await expect(page.locator('[data-calculator-currency]')).toContainText('Calculator currency: '+currency);
    await expect(page.locator('#calculator-currency')).toHaveCount(0);
    const label=page.locator('.calculator-form label').filter({hasText:new RegExp(currency)}).first();
    await expect(label).toBeVisible();
  }
  await page.goto('/inflation-calculator');
  await expect(page.locator('[data-calculator-currency]')).toContainText('Calculator currency: USD');
  await page.locator('#calculation-mode').click();
  await page.getByRole('option',{name:'Inflation scenario',exact:true}).click();
  await expect(page.locator('#calculator-currency')).toContainText('AED');
});

test('Arabic defaults and preference popovers work on small screens',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:360,height:800});
  await page.goto('/ar/loan-calculator');
  await expect(page.locator('#calculator-currency')).toContainText('AED');
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await page.getByRole('button',{name:'اللغة: العربية'}).click();
  await page.locator('#preferred-country').click();
  await page.getByRole('option',{name:'المملكة العربية السعودية',exact:true}).click();
  await expect(page.locator('#preferred-currency')).toContainText('SAR');
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(audit.violations.map(v=>v.id)).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'/tmp/finflo-currency-arabic.png'});
  expect(errors).toEqual([]);
});

test('storage failures do not prevent choosing a currency or calculating',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}});});
  await page.goto('/tip-calculator');
  await selectCurrency(page,'GBP');
  await page.locator('#tip-bill').fill('100');
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await expect(page.locator('.primary-metric dd')).toContainText('£');
  await expect(page.locator('#calculator-currency')).toContainText('GBP');
});

test('currency converter keeps its independently entered pair',async({page})=>{
  await page.goto('/currency-calculator');
  const inputs=page.locator('.calculator-form input[type="text"]');
  await inputs.nth(0).fill('GBP');await inputs.nth(1).fill('JPY');
  await page.getByRole('button',{name:'Language: English'}).click();
  await selectCurrency(page,'EUR','preferred-currency');
  await page.keyboard.press('Escape');
  await expect(inputs.nth(0)).toHaveValue('GBP');await expect(inputs.nth(1)).toHaveValue('JPY');
  await expect(page.locator('#calculator-currency')).toHaveCount(0);
});


test('early input waits for hydration and produces the entered amount',async({page})=>{
  let release!:()=>void;const scriptsReady=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/_next/static/**/*.js',async route=>{await scriptsReady;await route.continue();});
  try{
    await page.goto('/loan-calculator',{waitUntil:'domcontentloaded'});
    await expect(page.locator('#loan-principal')).toBeDisabled();
    release();
    await page.locator('#loan-principal').fill('1000');
    await page.locator('#loan-rate').fill('0');await page.locator('#loan-years').fill('1');
    await page.getByRole('button',{name:'Calculate',exact:true}).click();
    await expect(page.locator('.primary-metric dd')).toHaveText('$83.33');
  }finally{release();}
});
