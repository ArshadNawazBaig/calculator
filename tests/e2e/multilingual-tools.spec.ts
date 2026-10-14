import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
import {locales,translator} from '../../src/lib/i18n/config';
import {spinWheels} from '../../src/lib/spin-wheels/catalog';
import {toolkitDefinitions} from '../../src/lib/calculators/toolkit-definitions';

async function getContentDictionary(locale:string):Promise<Record<string,string>> {
 const [content,ui]=await Promise.all([readFile(`src/data/locales/content/${locale}.json`,'utf8'),readFile(`src/data/locales/${locale}.json`,'utf8')]);
 return {...JSON.parse(content),...JSON.parse(ui)};
}
test('wheel editing waits for hydration so early input cannot be lost',async({page})=>{
 let release!:()=>void;
 const ready=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/_next/static/**/*.js',async route=>{await ready;await route.continue();});
 try{
  await page.goto('/pt/spin-wheels/number-picker-wheel',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#wheel-entries')).toBeDisabled();
  await expect(page.locator('#wheel-minimum')).toBeDisabled();
  release();
  await page.locator('#wheel-entries').fill('123');
  await expect(page.locator('#wheel-entries')).toHaveValue('123');
 }finally{release();}
});
for(const locale of locales.filter(locale=>locale!=='en')){
 test(`${locale}: every wheel and toolkit route stays localized`,async({request})=>{
  test.setTimeout(120000);
  for(const path of ['/spin-wheels',...spinWheels.map(wheel=>`/spin-wheels/${wheel.slug}`),...toolkitDefinitions.map(tool=>`/${tool.slug}`)]){
   const response=await request.get(`/${locale}${path}`,{maxRedirects:0});
   expect(response.status(),path).toBe(200);
   const html=await response.text();
   expect(html).toContain(`lang="${locale}"`);
   expect(html).toContain(`rel="canonical" href="https://finflo.org/${locale}${path}"`);
   expect(html).toContain(`hrefLang="es" href="https://finflo.org/es${path}"`);
   expect(html).toContain(`hrefLang="ar" href="https://finflo.org/ar${path}"`);
  }
 });
 test(`${locale}: homepage filters, localized spins, colors and user entries work`,async({page})=>{
  const messages=await getContentDictionary(locale),t=translator(messages);
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(`/${locale}`);
  await page.getByRole('group',{name:t('Filter featured calculators')}).getByRole('button',{name:t('Spin wheels'),exact:true}).click();
  await expect(page.locator('#featured-calculators [data-calculator-card]')).toHaveCount(4);
  await page.locator('#featured-calculators a[href$="/yes-or-no-wheel"]').click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/spin-wheels/yes-or-no-wheel$`));
  await expect(page.getByRole('heading',{level:1})).toHaveText(t('Yes or No Wheel'));
  await expect(page.locator('#wheel-entries')).toHaveValue(`${t('Yes')}\n${t('No')}`);
  await page.locator('#wheel-entries').fill('My Custom Name Ω');
  await page.getByRole('button',{name:t('Spin the wheel'),exact:true}).click();
  await expect(page.locator('[data-wheel-result]')).toHaveText('My Custom Name Ω');
  await page.getByRole('button',{name:t('Remove picked entry'),exact:true}).click();
  await expect(page.locator('#wheel-entry-error')).toHaveText(t('Add at least one entry to spin.'));
  await page.goto(`/${locale}/spin-wheels/random-color-wheel`);
  await page.locator('#wheel-entries').fill(t('Red'));
  await page.getByRole('button',{name:t('Spin the wheel'),exact:true}).click();
  await expect(page.locator('[data-wheel-result]')).toHaveText(t('Red'));
  await expect(page.getByText('#EF4444',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(locale==='ar'){
   await expect(page.locator('html')).toHaveAttribute('dir','rtl');
   expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
  }
 });
}

test('language switch keeps a wheel, query and fragment and supports translated invoice downloads',async({page})=>{
 await page.goto('/spin-wheels/yes-or-no-wheel?from=home#wheel');
 await page.getByRole('button',{name:'Language: English'}).click();
 await page.getByRole('link',{name:'Español',exact:true}).click();
 await expect(page).toHaveURL(/\/es\/spin-wheels\/yes-or-no-wheel\?from=home#wheel$/);
 const t=translator(await getContentDictionary('es'));
 await page.goto('/es/invoice-generator');
 await page.locator('[data-calculator-submit]').click();
 await expect(page.locator('#invoice-preview-heading')).toHaveText(t('{type} preview',{type:t('Invoice')}));
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:t('Download {type} PDF',{type:t('Invoice')}),exact:true}).click();
 expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
 await expect(page.getByText(t('Your PDF is ready.'),{exact:false})).toBeVisible();
});
