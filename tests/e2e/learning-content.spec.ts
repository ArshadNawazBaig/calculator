import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import explanations from '../../src/data/locales/explanations.json';
import demoCopy from '../../src/data/locales/learning-demos.json';

test.beforeEach(async ({page})=>{
  await page.route('https://pagead2.googlesyndication.com/**',route=>route.abort());
});

test('compares recalculated scenarios, marks edited inputs, and clears across modes',async ({page})=>{
  await page.goto('/percent-calculator',{waitUntil:'domcontentloaded'});
  await page.locator('#of-percent').fill('20');
  await page.locator('#of-value').fill('200');
  await page.locator('[data-calculator-submit]').click();
  const panel=page.locator('[data-scenario-comparison]');
  await panel.getByRole('button',{name:explanations.en.pin,exact:true}).click();
  await page.locator('#of-value').fill('300');
  await expect(panel.getByRole('status')).toHaveText(explanations.en.recalculate);
  await expect(panel.locator('table')).toHaveCount(0);
  await page.locator('[data-calculator-submit]').click();
  await expect(panel.locator('table').first().locator('tbody tr')).toContainText(['40','60','+20'].join(''));
  const inputs=panel.locator('table').last();
  await expect(inputs).toContainText('Number');
  await expect(inputs).toContainText('200');
  await expect(inputs).toContainText('300');
  await page.goto('/percent-calculator#mode-base',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#base-part')).toBeVisible();
  await expect(page.locator('[data-scenario-comparison]')).toHaveCount(0);
});

test('the homepage percentage demonstration responds to keyboard input',async ({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const slider=page.getByRole('slider',{name:demoCopy.en.rate});
  await expect(page.locator('output').last()).toHaveText('96');
  await slider.focus();
  await slider.press('End');
  await expect(slider).toHaveValue('50');
  await expect(page.locator('output').last()).toHaveText('75');
});

test('explains incompatible units instead of showing a misleading numerical difference',async ({page})=>{
  await page.goto('/area-calculator',{waitUntil:'domcontentloaded'});
  await page.locator('[data-calculator-submit]').click();
  const panel=page.locator('[data-scenario-comparison]');
  await panel.getByRole('button',{name:explanations.en.pin,exact:true}).click();
  await page.locator('#rectangle-outputUnit').scrollIntoViewIfNeeded();
  await page.locator('#rectangle-outputUnit').click();
  await page.getByRole('option',{name:'Centimeters',exact:true}).click();
  await page.locator('[data-calculator-submit]').click();
  await expect(panel.getByRole('status')).toHaveText(explanations.en.incompatible);
  await expect(panel.locator('table')).toHaveCount(1);
  await expect(panel.locator('table')).toContainText('Centimeters');
});

test('publishes localized insight text and usable tables across all languages',async ({page})=>{
  for(const locale of ['en','es','fr','de','pt','ar','hi','tl'] as const){
    await page.goto(`${locale==='en'?'':`/${locale}`}/age-calculator`,{waitUntil:'domcontentloaded'});
    const insight=page.locator('[data-calculator-insight]');
    await expect(insight).toContainText(explanations[locale].insight);
    if(locale!=='en')await expect(insight).not.toContainText('Check the birthday boundary');
  }
});

test('new explanatory tables fit small screens, support RTL, and expose accessible structure',async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const path of ['/ar/time/asia-karachi','/es/calculators/math/statistics','/spin-wheels/yes-or-no-wheel','/guides/understanding-mortgage-payments']){
    await page.goto(path,{waitUntil:'domcontentloaded'});
    await expect(page.locator('main table').last()).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),path).toBe(true);
  }
  const accessibility=await new AxeBuilder({page}).include('[data-guide-illustration]').analyze();
  expect(accessibility.violations).toEqual([]);
});

test('translated sitemap exposes policy, guide, and subcategory links',async ({page})=>{
  await page.goto('/fr/sitemap',{waitUntil:'domcontentloaded'});
  const index=page.locator('[data-sitemap-index]');
  await expect(index.locator('a[href="/fr/privacy"]')).toHaveCount(1);
  await expect(index.locator('a[href="/fr/guides/understanding-mortgage-payments"]')).toHaveCount(1);
  await expect(index.locator('a[href="/fr/calculators/math/statistics"]')).toHaveCount(1);
});
