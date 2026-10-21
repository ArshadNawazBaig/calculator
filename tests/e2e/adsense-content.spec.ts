import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {practicalGuides} from '../../src/data/practical-guides';

test('English aliases reach the canonical page and preserve query parameters',async({request})=>{
  for(const [alias,target] of [['/en','/'],['/en/','/'],['/en?source=review','/?source=review'],['/en/?source=review','/?source=review'],['/en/guides','/guides']]){
    const response=await request.get(alias,{maxRedirects:4});
    expect(response.status(),alias).toBe(200);
    const url=new URL(response.url());
    expect(url.pathname+url.search,alias).toBe(target);
  }
});

test('card payoff starts with a balance and retains the alternative term mode',async({page})=>{
  await page.goto('/credit-card-calculator');
  await expect(page.locator('#payoff-principal')).toHaveValue('5000');
  await expect(page.locator('#payoff-rate')).toHaveValue('20');
  await expect(page.locator('#payoff-payment')).toHaveValue('200');
  await page.locator('[data-calculator-submit]').click();
  await expect(page.locator('#calculation-summary')).toContainText('$1,522.10');
  await page.goto('/credit-card-calculator#mode-loan');
  await expect(page.locator('#loan-years')).toHaveValue('3');
  await expect(page.locator('#loan-principal')).toHaveValue('5000');
});

test('student calculator references survive separation into dedicated pages',async({page})=>{
  for(const slug of ['grade-calculator','final-exam-grade-calculator','gpa-calculator','gpa-goal-calculator']){
    await page.goto(`/${slug}`);
    await expect(page.locator('#sources a[href="https://www.itl.nist.gov/div898/software/dataplot/refman2/ch2/weigmean.pdf"]')).toHaveCount(1);
    await expect(page.locator('#sources a[href="https://www.nist.gov/pml/special-publication-811"]')).toHaveCount(0);
  }
});

test('retains publisher verification without requesting ads on content or utility pages', async ({page, request})=>{
  const adRequests:string[]=[];
  page.on('request',request=>{if(/googlesyndication|doubleclick/.test(request.url()))adRequests.push(request.url());});
  for(const path of ['/','/es','/search?q=grade','/workspace','/offline']){
    await page.goto(path);
    await expect(page.locator('head meta[name="google-adsense-account"]')).toHaveAttribute('content','ca-pub-1970746421579261');
    await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
  }
  expect(adRequests).toEqual([]);
  const ads=await request.get('/ads.txt');
  expect(ads.ok()).toBe(true);
  expect(await ads.text()).toContain('google.com, pub-1970746421579261, DIRECT, f08c47fec0942fa0');
});

test('worked guides and comparison tables are readable without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage();
  try{
    for(const [slug,guide] of Object.entries(practicalGuides)){
      const response=await page.goto(`${test.info().project.use.baseURL}/guides/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading',{level:1})).toHaveText(guide.title);
      await expect(page.locator('article table')).toHaveCount(guide.sections.filter(s=>s.table).length);
      for(const section of guide.sections.filter(s=>s.table))await expect(page.getByRole('table',{name:section.table!.caption,exact:true})).toBeVisible();
      const links=page.getByRole('navigation',{name:'In this guide'}).getByRole('link');
      await expect(links).toHaveCount(guide.sections.length);
      await links.last().click();
      await expect(page).toHaveURL(new RegExp(`#guide-section-${guide.sections.length}$`));
    }
  }finally{await context.close();}
});

test('new guides link to working calculator modes and are discoverable from tools',async({page})=>{
  await page.goto('/percent-calculator');
  await page.locator('#related-guides a').click();
  await expect(page).toHaveURL(/comparing-discounts-and-percentage-changes$/);
  await page.getByRole('link',{name:'Recover an original value with the percentage calculator'}).click();
  await expect(page.locator('#reverse-final')).toBeVisible();
  await page.goto('/guides/weighted-grades-and-final-exam-targets');
  await page.getByRole('link',{name:'Calculate a final-exam target',exact:true}).click();
  await expect(page.locator('#final-current')).toBeVisible();
});

test('new tables fit mobile and use accessible headings and captions',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const slug of Object.keys(practicalGuides)){
    await page.goto(`/guides/${slug}`);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    const accessibility=await new AxeBuilder({page}).include('article').analyze();
    expect(accessibility.violations).toEqual([]);
  }
});

test('English-only guides do not advertise missing translations',async({page,request})=>{
  const slug=Object.keys(practicalGuides)[0];
  await page.goto(`/guides/${slug}`);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await page.getByRole('button',{name:'Language: English',exact:true}).click();
  await expect(page.getByRole('navigation',{name:'Website language'}).getByRole('link')).toHaveCount(1);
  const alias=await request.get(`/es/guides/${slug}`,{maxRedirects:0});
  expect(alias.status()).toBe(307);
  expect(new URL(alias.headers().location,alias.url()).pathname).toBe(`/guides/${slug}`);
  await page.goto('/es/guides');
  await expect(page).toHaveURL(/\/guides$/);
  await expect(page.locator('html')).toHaveAttribute('lang','en');
});
