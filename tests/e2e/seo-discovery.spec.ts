import {isPublishedLocale,splitLocale} from '../../src/lib/i18n/config';
import {test, expect} from '@playwright/test';
import es from '../../src/data/locales/es.json';

test('avoids unused script-font preloads and retains the correct language fonts', async ({page}) => {
  for (const [path,variable] of [['/','--font-site'],['/es','--font-site'],['/ar','--font-arabic'],['/hi','--font-hindi']] as const) {
    if(!isPublishedLocale(splitLocale(path).locale))continue;
    await page.goto(path);
    await expect(page.locator('link[rel="preload"][as="font"]')).toHaveCount(1);
    await page.evaluate(()=>document.fonts.ready);
    // next/font/local generates its own family names. Check the language's
    // configured family and its loaded face, rather than the original font name.
    const font = await page.evaluate(variable => {
      const first = (value: string) => value.split(',')[0].trim().replaceAll('"', '').replaceAll("'", '');
      const expected = first(getComputedStyle(document.documentElement).getPropertyValue(variable));
      return {expected, actual: first(getComputedStyle(document.body).fontFamily), loaded: [...document.fonts].some(face => first(face.family) === expected && face.status === 'loaded')};
    }, variable);
    expect(font.expected).not.toBe('');
    expect(font.actual).toBe(font.expected);
    expect(font.loaded).toBe(true);
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
  await page.locator('#calculation-mode').getByRole('button',{name:'Equivalent interest rate',exact:true}).click();
  await expect(page.locator('#equivalent-rate')).toBeVisible();
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('6.17%');
});

test('translated cards keep their descriptions across calculator, guide, and search navigation', async ({page,request}) => {
  test.skip(!isPublishedLocale('es'), 'This translation is not published.');
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
  await expect(page).toHaveTitle('Free Finance, Health, Math & Everyday Calculators');
  const schemas=await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schemas.map(value=>JSON.parse(value)['@type'])).toEqual(['WebSite','Organization']);
  expect(JSON.parse(schemas[0])).toMatchObject({
    '@id': 'https://finflo.org/#website',
    name: 'Finflo.org', alternateName: 'Finflo', url: 'https://finflo.org',
  });
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', 'Finflo.org');
  await expect(page.locator('.footer-bottom')).toContainText('Finflo.org');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://finflo.org');
  await page.goto('/area-calculator');
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', 'Finflo.org');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://finflo.org/area-calculator');
  await page.goto('/guides/understanding-mortgage-payments');
  await expect(page.locator('.editorial-note')).toContainText('Prepared by Finflo');
  const article=await page.locator('script[type="application/ld+json"]').allTextContents();
  const data=article.map(value=>JSON.parse(value)).find(value=>value['@type']==='Article');
  expect(data.author.name).toBe('Finflo');
  expect(data.headline).toBe(await page.locator('h1').innerText());
  await page.goto('/about');
  await expect(page).toHaveTitle('About Finflo');
  await page.goto('/methodology');
  await expect(page).toHaveTitle('Our methodology');
  if(!isPublishedLocale('es'))return;
  await page.goto('/es/compound-interest-calculator');
  await expect(page).toHaveTitle('Calculadora de interés compuesto con depósitos mensuales');
});
