import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('loan charts use recalculated data and the entire table stays expanded',async({page})=>{
  await page.goto('/loan-calculator');
  await expect(page.locator('#calculation-table tbody tr')).toHaveCount(360);
  await expect(page.locator('[data-chart="timeline"]')).toBeVisible();
  await expect(page.locator('[data-chart="composition"]')).toBeVisible();
  const table=page.locator('#calculation-table');
  const workspace=page.locator('.calculator-workspace');
  expect((await table.boundingBox())!.width).toBeCloseTo((await workspace.boundingBox())!.width,0);
  const scroll=table.locator('.table-scroll');
  expect(await scroll.evaluate(el=>getComputedStyle(el).maxHeight)).toBe('none');
  expect(await scroll.evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
  await page.locator('#loan-principal').fill('1200');await page.locator('#loan-rate').fill('0');await page.locator('#loan-years').fill('1');
  await expect(page.locator('.result-detail-sections>.stale-note')).toBeVisible();
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('$100.00');
  await expect(table.locator('tbody tr')).toHaveCount(12);
  const slider=page.getByRole('slider',{name:'Explore the timeline'});
  await slider.focus();await page.keyboard.press('Home');
  await expect(slider).toHaveAttribute('aria-valuetext','Payment 1; Balance: $1,100.00');
  await page.keyboard.press('End');
  await expect(slider).toHaveAttribute('aria-valuetext','Payment 12; Balance: $0.00');
  await expect(table.locator('tbody tr').last().locator('td').last()).toHaveText('0.00');
  await expect(page.locator('.result-detail-sections>.stale-note')).toHaveCount(0);
  await page.emulateMedia({media:'print'});
  await expect(table.locator('tbody tr').last()).toBeVisible();
  expect(await scroll.evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
  await page.emulateMedia({media:'screen'});
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await expect(table).toHaveCount(0);await expect(page.locator('[data-result-charts]')).toHaveCount(0);
});

test('negative and zero growth remain truthful and currency-aware',async({page})=>{
  await page.goto('/savings-calculator');
  await page.locator('#growth-initial').fill('1000');await page.locator('#growth-contribution').fill('0');
  await page.locator('#growth-rate').fill('-10');await page.locator('#growth-years').fill('2');
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  const comparison=page.locator('[data-chart="comparison"]');
  await expect(comparison).toContainText('-$');
  await expect(page.locator('[data-chart="composition"]')).toHaveCount(0);
  await expect(page.locator('[data-chart="timeline"] path')).toHaveCount(2);
  await page.locator('#calculator-currency').click();await page.getByRole('option',{name:/^EUR ·/}).click();
  await expect(comparison).toContainText('-€');
  await expect(page.getByRole('slider')).toHaveAttribute('aria-valuetext',/€/);
  for(const path of await page.locator('[data-chart] svg path').all())expect(await path.getAttribute('d')).not.toMatch(/NaN|Infinity/);
  await page.locator('#growth-initial').fill('0');await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await expect(comparison).toContainText('€0.00');
  await expect(page.locator('.form-error')).toHaveCount(0);
});

test('mobile Arabic charts and full tables are accessible without page overflow',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:360,height:800});await page.goto('/ar/loan-calculator');
  await page.locator('#loan-principal').fill('1200');await page.locator('#loan-years').fill('1');
  await page.getByRole('button',{name:'احسب',exact:true}).click();
  await expect(page.locator('#calculation-table tbody tr')).toHaveCount(12);
  await expect(page.locator('[data-chart="timeline"]')).toContainText('رصيد القرض بمرور الوقت');
  await expect.poll(()=>page.locator('[data-chart="timeline"] svg').evaluate(el=>Math.abs(el.getBoundingClientRect().width-(el as SVGSVGElement).viewBox.baseVal.width))).toBeLessThan(1);
  const slider=page.getByRole('slider');await slider.focus();await page.keyboard.press('Home');
  await expect(slider).toHaveAttribute('aria-valuetext',/١/);
  const scroll=page.locator('#calculation-table .table-scroll');
  expect(await scroll.evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
  expect(await scroll.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const audit=await new AxeBuilder({page}).include('.calculator-workspace').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(audit.violations).toEqual([]);expect(errors).toEqual([]);
});
