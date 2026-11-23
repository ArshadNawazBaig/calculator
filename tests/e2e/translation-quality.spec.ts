import {test, expect} from '@playwright/test';

for (const example of [
  {locale: 'fr', first: 'Premier terme', second: 'Deuxième terme', factor: 'Facteur d’échelle', shrink: 'réduire', mode: 'Mettre un rapport à l’échelle'},
  {locale: 'pt', first: 'Primeiro termo', second: 'Segundo termo', factor: 'Fator de escala', shrink: 'reduzir', mode: 'Escalonar uma razão'},
]) {
  test(`${example.locale}: translated ratio controls select the shrink calculation`, async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto(`/${example.locale}/ratio-calculator#mode-scale`);
    await expect(page.locator('#scale-a-label')).toHaveText(example.first);
    await expect(page.locator('#scale-b-label')).toHaveText(example.second);
    await expect(page.locator('#scale-factor-label')).toHaveText(example.factor);
    await page.locator('#scale-a').fill('15');
    await page.locator('#scale-b').fill('20');
    await page.locator('#scale-factor').fill('5');
    await page.locator('#scale-direction').click();
    await page.getByRole('option', {name: example.shrink, exact: true}).click();
    await page.locator('[data-calculator-submit]').click();
    await expect(page.locator('.primary-metric dd')).toHaveText('3 : 4');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.goto(`/${example.locale}/guides/sharing-and-scaling-ratios`);
    const workedExample = page.locator('#guide-section-2');
    for (const label of [example.mode, example.first, example.second, example.factor]) await expect(workedExample).toContainText(label);
    await expect(page.locator('#guide-section-5')).toContainText(example.mode);
  });
}

test('Filipino finance labels and the editorial translation disclosure are rendered', async ({page}) => {
  await page.goto('/tl/payback-period-calculator');
  await expect(page.locator('#payback-rate-label')).toContainText('Rate ng diskuwento');
  await page.goto('/tl/editorial-policy');
  await expect(page.getByText('Ang ilang bersiyon sa ibang wika ay gumagamit ng mga draft na tinulungan ng makina', {exact: false})).toBeVisible();
});

test('German body-fat results distinguish lean mass from muscle', async ({page}) => {
  await page.goto('/de/body-fat-calculator');
  await expect(page.locator('#calculation-summary dt').getByText('Geschätzte Magermasse', {exact: true})).toBeVisible();
  await expect(page.getByText('Fettfreie Masse umfasst Wasser, Organe, Knochen', {exact: false})).toBeVisible();
  await expect(page.getByText('nicht dasselbe wie Skelettmuskelmasse', {exact: false})).toBeVisible();
});

test('2027 401(k) scenario shows the age-60 limit and its assumptions', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/401k-calculator#mode-salary-match');
  await page.locator('#salary-match-age').fill('60');
  await page.locator('#salary-match-salary').fill('100000');
  await page.locator('#salary-match-employeeDeferralPercent').fill('100');
  await page.locator('#salary-match-years').fill('1');
  await page.locator('#salary-match-limitPolicy').click();
  await page.getByRole('option', {name: 'Apply 2027 limits, frozen for future years'}).click();
  await page.locator('[data-calculator-submit]').click();
  await expect(page.locator('#calculation-summary')).toContainText('Employee contributions');
  await expect(page.locator('#calculation-summary')).toContainText('$37,250.00');
  await expect(page.locator('#calculation-summary')).toContainText('2027 limits are frozen');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('Arabic 2027 IRA ceiling keeps the account name and eligibility caveat', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/ar/ira-calculator#mode-2027-ceiling');
  await page.locator('[id="2027-ceiling-age"]').fill('50');
  await page.locator('[data-calculator-submit]').click();
  await expect(page.locator('#calculation-summary')).toContainText('الحد المشترك لمساهمات حسابات IRA لعام 2027');
  await expect(page.locator('#calculation-summary')).toContainText('٨٬٦٠٠');
  await expect(page.locator('#calculation-summary')).toContainText('قيود MAGI');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('homepage section links reach the guides on mobile without JavaScript', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled: false, viewport: {width: 390, height: 844}});
  const page = await context.newPage();
  try {
    for (const [path, label] of [['/', 'On this page'], ['/ar', 'في هذه الصفحة']] as const) {
      await page.goto(path);
      await page.getByRole('navigation', {name: label, exact: true}).locator('a[href="#guides-title"]').click();
      await expect(page).toHaveURL(/#guides-title$/);
      await expect(page.locator('#guides-title')).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  } finally {
    await context.close();
  }
});
