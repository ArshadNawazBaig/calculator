import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('language selection waits for its handlers on a slow connection',async({page})=>{
  let release!:()=>void;
  const scriptsReady=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/_next/static/**/*.js',async route=>{await scriptsReady;await route.continue();});
  try{
    await page.goto('/es',{waitUntil:'domcontentloaded'});
    const trigger=page.getByRole('button',{name:'Idioma: Español'});
    await expect(trigger).toBeDisabled();
    release();
    await trigger.click();
    await expect(page.getByRole('dialog',{name:'Idioma del sitio'}).getByRole('link',{name:'English',exact:true})).toBeVisible();
  }finally{release();}
});

test('language menu keeps the current calculator and changes the document language',async({page})=>{
  await page.goto('/mortgage-calculator');
  await page.getByRole('button',{name:'Language: English'}).click();
  await expect(page.getByRole('dialog',{name:'Website language'}).getByRole('link')).toHaveCount(6);
  await page.getByRole('link',{name:'Español',exact:true}).click();
  await expect(page).toHaveURL(/\/es\/mortgage-calculator$/);
  await expect(page.locator('html')).toHaveAttribute('lang','es');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Hipoteca');
  await expect(page.getByRole('button',{name:'Calcular',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Idioma: Español'}).click();
  await page.getByRole('link',{name:'English',exact:true}).click();
  await expect(page).toHaveURL(/\/mortgage-calculator$/);
  await expect(page.locator('html')).toHaveAttribute('lang','en');
});

test('Spanish suggestions and category filters search translated names',async({page})=>{
  await page.goto('/es');
  const input=page.getByRole('combobox',{name:'Buscar calculadoras'});
  await input.fill('interes compuesto');
  await expect(page.getByRole('option')).toHaveCount(1);
  await input.press('ArrowDown');await input.press('Enter');
  await expect(page).toHaveURL(/\/es\/compound-interest-calculator$/);
  await page.goto('/es/calculators/finance');
  await page.getByRole('searchbox').fill('hipoteca');
  const cards=page.locator('[data-calculator-card]');
  await expect(cards.first()).toBeVisible();
  for(const text of await cards.locator('h3').allTextContents())expect(text.toLowerCase()).toContain('hipoteca');
  await page.getByRole('searchbox').fill('no-results-xyz');
  await expect(page.getByRole('heading',{name:'No se encontraron calculadoras'})).toBeVisible();
});

test('Arabic pages use RTL, localized navigation, and calculate without changing the model',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/ar/percent-calculator');
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await expect(page.locator('html')).toHaveAttribute('lang','ar');
  const numbers=page.locator('.calculator-form input[type="number"]');
  await numbers.nth(0).fill('25');await numbers.nth(1).fill('200');
  await page.getByRole('button',{name:'احسب',exact:true}).click();
  await expect(page.locator('.primary-metric dd')).toContainText('٥٠');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('button',{name:'فتح قائمة التنقل'}).click();
  await page.getByRole('navigation',{name:'التنقل على الهاتف'}).getByRole('link',{name:'المالية',exact:true}).click();
  await expect(page).toHaveURL(/\/ar\/calculators\/finance$/);
});

test('server HTML has localized metadata and invalid localized routes return 404',async({request})=>{
  for(const [locale,title] of [['es','Encuentra tu respuesta.'],['fr','Trouvez votre réponse.'],['de','Finde deine Antwort.'],['pt','Encontre sua resposta.'],['ar','اعثر على إجابتك.']]){
    const response=await request.get(`/${locale}`);expect(response.status()).toBe(200);
    const html=await response.text();
    expect(html).toContain(`lang="${locale}"`);expect(html).toContain(title);
    expect(html).toContain(`href="https://finflo.org/${locale}"`);
    expect(html).toContain('hrefLang="x-default"');
  }
  expect((await request.get('/fr/not-a-real-calculator')).status()).toBe(404);
  expect(await (await request.get('/es/mortgage-calculator')).text()).toContain('name="robots" content="noindex, follow"');
  const redirects=await request.get('/en/calculators',{maxRedirects:0});expect(redirects.status()).toBe(308);
});

test('French date picker uses Gregorian dates and the language switch preserves search parameters',async({page})=>{
  await page.goto('/fr/age-calculator');
  await page.getByRole('button',{name:'Ouvrir le calendrier'}).first().click();
  await expect(page.getByRole('button',{name:'Aujourd’hui',exact:true})).toBeVisible();
  await expect(page.getByRole('grid')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Calculer',exact:true}).click();
  await expect(page.locator('.primary-metric dd')).not.toBeEmpty();
  await page.goto('/es/search?q=hipoteca&category=finance#main');
  await page.getByRole('button',{name:'Idioma: Español'}).click();
  await page.getByRole('link',{name:'Français',exact:true}).click();
  await expect(page).toHaveURL(/\/fr\/search\?q=hipoteca&category=finance#main$/);
});

test('translated pages retain accessible contrast and fit narrow and desktop screens',async({page})=>{
  for(const path of ['/es','/ar','/ar/percent-calculator']){
    await page.goto(path);
    const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(audit.violations.map(v=>`${v.id}: ${v.description}`)).toEqual([]);
  }
  for(const width of [360,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    for(const locale of ['es','fr','de','pt','ar']){
      await page.goto(`/${locale}`);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`${locale} at ${width}px`).toBe(true);
    }
  }
});
