import {test, expect} from '@playwright/test';

for (const language of [
  {locale:'hi', name:'हिन्दी', currency:'INR', calculate:'गणना करें', title:'प्रतिशत कैलकुलेटर'},
  {locale:'tl', name:'Filipino', currency:'PHP', calculate:'Kalkulahin', title:'Kalkulador ng porsiyento'},
]) {
  test(`${language.name} calculates, renders translated guidance, and keeps the language on navigation`, async ({page}) => {
    await page.setViewportSize({width:390, height:844});
    await page.goto(`/${language.locale}/percent-calculator`);
    await expect(page.locator('html')).toHaveAttribute('lang', language.locale);
    await expect(page.getByRole('heading', {level:1})).toHaveText(language.title);
    const fields = page.locator('.calculator-form input[type="number"]');
    await fields.nth(0).fill('25');
    await fields.nth(1).fill('200');
    await page.getByRole('button', {name:language.calculate, exact:true}).click();
    await expect(page.locator('.primary-metric dd')).toContainText('50');
    expect(await page.locator('#understanding-1').innerText()).not.toContain('Choosing the correct percentage question');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const family = await page.locator('#understanding-1').evaluate(element => getComputedStyle(element).fontFamily);
    if (language.locale === 'hi') expect(family).toMatch(/Noto[_ ]Sans[_ ]Devanagari/i);
    await page.goto(`/${language.locale}/loan-calculator`);
    await expect(page.locator('.calculator-form')).toContainText(language.currency);
    await page.goto(`/${language.locale}/calculators/finance`);
    const related = page.locator('.directory-guidance a').first();
    await expect(related).toHaveAttribute('href', `/${language.locale}/loan-calculator`);
    await related.click();
    await expect(page).toHaveURL(new RegExp(`/${language.locale}/loan-calculator$`));
  });
}

test('all eight languages fit the menu and retain query parameters and fragment', async ({page}) => {
  await page.setViewportSize({width:360, height:640});
  await page.goto('/search?q=loan&category=finance#main');
  await page.getByRole('button', {name:'Language: English'}).click();
  const dialog = page.getByRole('dialog', {name:'Website language'});
  await expect(dialog.getByRole('link')).toHaveCount(8);
  await dialog.getByRole('link', {name:'Filipino', exact:true}).click();
  await expect(page).toHaveURL(/\/tl\/search\?q=loan&category=finance#main$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('new language pages advertise reciprocal alternatives and support legacy redirects', async ({request}) => {
  for (const locale of ['hi','tl']) {
    const response = await request.get(`/${locale}/mortgage-calculator`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`rel="canonical" href="https://finflo.org/${locale}/mortgage-calculator"`);
    for (const alternate of ['hi','tl']) expect(html).toContain(`hrefLang="${alternate}" href="https://finflo.org/${alternate}/mortgage-calculator"`);
    expect(html).toContain('id="understanding-1"');
    const alias = await request.get(`/${locale}/percentage-calculator`, {maxRedirects:0});
    expect(alias.status()).toBe(308);
    expect(alias.headers().location).toBe(`/${locale}/percent-calculator`);
    expect((await request.get(`/${locale}/not-a-calculator`)).status()).toBe(404);
  }
});
