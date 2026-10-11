import {test, expect} from '@playwright/test';
import es from '../../src/data/locales/es.json';

test('avoids unused script-font preloads and retains the correct language fonts', async ({page}) => {
  for (const [path,font] of [['/','Manrope'],['/es','Manrope'],['/ar','Noto Sans Arabic'],['/hi','Noto Sans Devanagari']] as const) {
    await page.goto(path);
    await expect(page.locator('link[rel="preload"][as="font"]')).toHaveCount(1);
    await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>getComputedStyle(document.body).fontFamily)).toContain(font);
  }
});

test('compound interest opens with savings growth and retains rate conversion', async ({page}) => {
  await page.goto('/compound-interest-calculator');
  await expect(page.locator('#growth-initial')).toBeVisible();
  await page.locator('#growth-initial').fill('10000');
  await page.locator('#growth-contribution').fill('0');
  await page.locator('#growth-rate').fill('0');
  await page.locator('#growth-years').fill('10');
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('$10,000.00');
  await expect(page.locator('#related-guides a')).toHaveAttribute('href','/guides/compound-interest-and-contributions');
  await page.getByRole('button',{name:/What would you like to calculate/}).click();
  await page.getByRole('option',{name:'Equivalent interest rate',exact:true}).click();
  await expect(page.locator('#equivalent-rate')).toBeVisible();
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('6.17%');
});

test('translated cards keep their descriptions across calculator, guide, and search navigation', async ({page,request}) => {
  const privacy = await (await request.get('/es/privacy')).text();
  expect(privacy).not.toContain('description.mortgage-calculator');
  await page.goto('/es/bmi-calculator');
  const cards=page.locator('.related-tools [data-calculator-card]');
  await expect(cards).toHaveCount(6);
  await expect(cards.filter({hasText:es['tool.healthy-weight-calculator']})).toContainText(es['description.healthy-weight-calculator']);
  const schemas=await page.locator('script[type="application/ld+json"]').allTextContents();
  const breadcrumb=schemas.map(value=>JSON.parse(value)).find(value=>value['@type']==='BreadcrumbList');
  expect(breadcrumb.itemListElement.at(-1).item).toBe('https://finflo.org/es/bmi-calculator');
  await page.locator('#related-guides a').click();
  await expect(page).toHaveURL(/\/es\/guides\/bmi-as-a-screening-tool$/);
  const article=await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(article.map(value=>JSON.parse(value)).find(value=>value['@type']==='Article').headline).toBe(await page.locator('h1').innerText());
  await page.goto('/es/search?q=hipoteca');
  await expect(page.locator('[data-calculator-card]').filter({has:page.getByRole('link',{name:es['tool.mortgage-calculator'],exact:true})})).toContainText(es['description.mortgage-calculator']);
  await page.goto('/es/calculators/health');
  await expect(page.locator('[data-calculator-card]').filter({has:page.getByRole('link',{name:es['tool.bmi-calculator'],exact:true})})).toContainText(es['description.bmi-calculator']);
});

test('English homepage and guide expose consistent identity and authorship', async ({page}) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Free Finance, Health, Math & Everyday Calculators | Finflo');
  const schemas=await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schemas.map(value=>JSON.parse(value)['@type'])).toEqual(['WebSite','Organization']);
  await page.goto('/guides/understanding-mortgage-payments');
  await expect(page.locator('.editorial-note')).toContainText('Prepared by Finflo');
  const article=await page.locator('script[type="application/ld+json"]').allTextContents();
  const data=article.map(value=>JSON.parse(value)).find(value=>value['@type']==='Article');
  expect(data.author.name).toBe('Finflo');
  expect(data.headline).toBe(await page.locator('h1').innerText());
});
