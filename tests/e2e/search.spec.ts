import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('live search ranks direct matches and opens a keyboard selection',async({page})=>{
  await page.goto('/');
  const input=page.getByRole('combobox',{name:'Search calculators'});
  await input.fill('mortgage');
  await expect(input).toHaveAttribute('aria-expanded','true');
  const options=page.getByRole('option');
  await expect(options).toHaveCount(5);
  await expect(options.first()).toContainText('Mortgage Calculator');
  await expect(options.first()).toContainText('Finance');
  await expect(page.getByRole('option',{selected:true})).toHaveCount(0);
  await input.press('ArrowDown');
  await expect(options.first()).toHaveAttribute('aria-selected','true');
  await expect(input).toHaveAttribute('aria-activedescendant',(await options.first().getAttribute('id'))!);
  await input.press('ArrowDown');
  await expect(options.nth(1)).toHaveAttribute('aria-selected','true');
  await input.press('ArrowUp');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/mortgage-calculator$/);
  await expect(page.getByRole('region',{name:'Interactive calculator'})).toBeVisible();
});

test('suggestions dismiss cleanly and handle empty searches',async({page})=>{
  await page.goto('/');
  const input=page.getByRole('combobox',{name:'Search calculators'});
  await input.fill('interest');
  await input.press('Escape');
  await expect(input).toHaveValue('interest');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await input.press('ArrowUp');
  await expect(page.getByRole('option').last()).toHaveAttribute('aria-selected','true');
  await input.press('Tab');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Clear search',exact:true})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'Search',exact:true})).toBeFocused();
  await input.click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.getByRole('heading',{level:1}).click();
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await input.click();
  await page.getByRole('button',{name:'Clear search',exact:true}).click();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await input.fill('   ');
  await expect(input).toHaveAttribute('aria-expanded','false');
  await input.fill('zzzz-no-match');
  await expect(page.getByText('No calculators found',{exact:true})).toBeVisible();
  await expect(page.getByRole('option')).toHaveCount(0);
  await page.getByRole('button',{name:'Browse all calculators',exact:true}).click();
  await expect(page).toHaveURL(/\/calculators$/);
  await input.fill('age');
  await expect(page.getByRole('option').first()).toContainText('Age Calculator');
  await page.getByRole('option').first().click();
  await expect(page).toHaveURL(/\/age-calculator$/);
});

test('suggestions and full results respect the selected category',async({page})=>{
  await page.goto('/');
  await page.getByRole('group',{name:'Filter featured calculators'}).getByRole('button',{name:'Health',exact:true}).click();
  const input=page.getByRole('combobox',{name:'Search calculators'});
  await input.fill('mortgage');
  await expect(page.getByText('No matches in health',{exact:true})).toBeVisible();
  await page.getByRole('search').getByRole('button',{name:'Search all categories',exact:true}).click();
  await expect(page).toHaveURL(/\/search\?q=mortgage$/);
  await page.goto('/');
  await page.getByRole('group',{name:'Filter featured calculators'}).getByRole('button',{name:'Health',exact:true}).click();
  await input.fill('bmi');
  await expect(page.getByRole('option').first()).toContainText('BMI Calculator');
  await page.getByRole('button',{name:'View all results',exact:true}).click();
  await expect(page).toHaveURL(/\/search\?q=bmi&category=health$/);
  await expect(page.getByRole('link',{name:'BMI Calculator',exact:true})).toBeVisible();
});

test('open suggestions are accessible and support mobile taps',async({page,browser,baseURL})=>{
  await page.goto('/');
  const input=page.getByRole('combobox',{name:'Search calculators'});
  await input.fill('compound-interest');
  await expect(page.getByRole('option').first()).toContainText('Compound Interest Calculator');
  await input.press('ArrowDown');
  expect(await input.evaluate(element=>getComputedStyle(element).outlineStyle)).toBe('none');
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
  const context=await browser.newContext({baseURL,viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  try{
    const mobile=await context.newPage();
    await mobile.goto('/');
    await mobile.getByRole('combobox',{name:'Search calculators'}).fill('mortgage');
    expect(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await mobile.getByRole('option').first().tap();
    await expect(mobile).toHaveURL(/\/mortgage-calculator$/);
  }finally{await context.close();}
});
