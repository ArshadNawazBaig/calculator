import {isPublishedLocale, publishedLocales} from '../../src/lib/i18n/config';
import {test,expect} from '@playwright/test';

// Run against `next dev` to exercise React's attribute mismatch diagnostics.
for(const locale of ['en','ar','hi'] as const)test(`${locale}: extension body attributes do not interrupt hydration`,async({page})=>{
  test.skip(!isPublishedLocale(locale), 'This translation is not published.');
  const hydrationErrors:string[]=[];
  const pageErrors:string[]=[];
  page.on('console',message=>{
    if(message.type()==='error'&&/hydrated|hydration|didn't match/i.test(message.text()))hydrationErrors.push(message.text());
  });
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.addInitScript(()=>{
    const install=()=>{
      if(!document.body)return false;
      document.body.setAttribute('data-new-gr-c-s-check-loaded','14.1336.0');
      document.body.setAttribute('data-gr-ext-installed','');
      return true;
    };
    if(!install()){
      const observer=new MutationObserver(()=>{if(install())observer.disconnect();});
      observer.observe(document,{childList:true,subtree:true});
    }
  });
  await page.goto(`${locale==='en'?'':'/'+locale}/calculators`);
  await expect(page.locator('body')).toHaveAttribute('data-new-gr-c-s-check-loaded','14.1336.0');
  await expect(page.locator('body')).toHaveAttribute('data-gr-ext-installed','');
  await expect(page.locator('html')).toHaveAttribute('lang',locale);
  const language=page.locator('header button').filter({has:page.locator('svg.lucide-languages')});
  await language.click();
  const dialog=page.getByRole('dialog');
  await expect(dialog.getByRole('link')).toHaveCount(publishedLocales.length);
  await expect(dialog.locator('a[aria-current="true"]')).toHaveAttribute('lang',locale);
  await page.keyboard.press('Escape');
  await expect(language).toBeFocused();
  expect(hydrationErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
