import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function accessible(page:Page){
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
}

test('dropdown supports keyboard selection, dismissal, and accessible options',async({page})=>{
  await page.goto('/gfr-calculator');
  const trigger=page.getByRole('button',{name:/Sex used by the equation/});
  await expect(trigger).toBeEnabled();
  await trigger.focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox',{name:'Sex used by the equation'})).toBeVisible();
  await accessible(page);
  await page.keyboard.press('f');await page.keyboard.press('Enter');
  await expect(trigger).toContainText('Female');await expect(trigger).toBeFocused();
  await trigger.click();await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);await expect(trigger).toBeFocused();
  await trigger.click();await expect(page.getByRole('listbox')).toBeVisible();await page.mouse.click(80,150);
  await expect(page.getByRole('listbox')).toHaveCount(0);
});

test('calendar supports searchable years, leap days, and nested keyboard dismissal',async({page})=>{
  await page.goto('/age-calculator');
  const trigger=page.getByRole('button',{name:'Open calendar Date of birth',exact:true});
  await trigger.click();await accessible(page);
  await page.getByRole('button',{name:'1995 year'}).click();await accessible(page);
  const search=page.getByRole('searchbox',{name:'Search options'});
  await search.fill('zzzz');await expect(page.getByText('No matching options')).toBeVisible();
  await search.fill('2000');await expect(page.getByRole('option')).toHaveCount(1);
  await search.press('ArrowDown');await search.press('Enter');
  await expect(page.getByRole('button',{name:'2000 year'})).toBeVisible();
  await page.getByRole('button',{name:'Jun month'}).click();await page.getByRole('option',{name:'Feb',exact:true}).click();
  await page.getByRole('button',{name:'Tuesday, February 29, 2000',exact:true}).click();
  await expect(page.locator('input[name="birth"]').first()).toHaveValue('2000-02-29');
  await expect(trigger).toBeFocused();
  await trigger.click();await page.getByRole('button',{name:'2000 year'}).click();
  await page.keyboard.press('Escape');await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(page.getByRole('grid',{name:'February 2000'})).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('typed dates preserve ISO values, calculate correctly, validate, and reset',async({page})=>{
  await page.goto('/age-calculator');
  for(const [label,year] of [['Date of birth','2000'],['Age on','2024']]){
    for(const [segment,value] of [['year',year],['month','02'],['day','29']]){
      const input=page.getByRole('spinbutton',{name:`${segment}, ${label}`,exact:true});
      await input.focus();await input.pressSequentially(value);
    }
  }
  await expect(page.locator('input[name="birth"]').first()).toHaveValue('2000-02-29');
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await expect(page.locator('.primary-metric dd')).toHaveText('24 years, 0 months, 0 days');
  await page.getByRole('button',{name:'Open calendar Date of birth',exact:true}).click();
  await page.getByRole('button',{name:'Clear',exact:true}).click();
  await expect(page.locator('input[name="birth"]').first()).toHaveValue('');
  await page.getByRole('button',{name:'Calculate',exact:true}).click();
  await expect(page.getByRole('spinbutton',{name:'month, Date of birth',exact:true})).toHaveAttribute('aria-invalid','true');
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await expect(page.locator('input[name="birth"]').first()).toHaveValue('1995-06-15');
  await expect(page.getByRole('spinbutton',{name:'month, Date of birth',exact:true})).not.toHaveAttribute('aria-invalid','true');
});

test('optional dates remain usable when adding and removing calculator rows',async({page})=>{
  await page.goto('/debt-payoff-calculator');
  await page.locator('#calculation-mode').click();
  await page.getByRole('option',{name:'Payment budgets, rollover & dated extras',exact:true}).click();
  const extras=page.getByRole('group',{name:'One-time extras',exact:true});
  await extras.getByRole('button',{name:'Add row',exact:true}).click();
  await extras.getByRole('button',{name:'Open calendar Date (optional)',exact:true}).click();
  await page.getByRole('button',{name:'Today',exact:true}).click();
  await expect(extras.locator('[data-type="day"]')).not.toHaveAttribute('data-placeholder');
  await extras.getByRole('button',{name:'Open calendar Date (optional)',exact:true}).click();
  await page.getByRole('button',{name:'Clear',exact:true}).click();
  await expect(extras.locator('[data-type="day"]')).toHaveAttribute('data-placeholder','true');
  await extras.getByRole('button',{name:'Add row',exact:true}).click();
  await extras.getByRole('button',{name:'Remove row 1',exact:true}).click();
  await expect(extras.locator('[data-ui-control="date-picker"]')).toHaveCount(1);
  await expect(extras.locator('[data-type="day"]')).toHaveAttribute('data-placeholder','true');
});

for(const width of [320,390])test(`calendar fits and responds to touch at ${width}px`,async({browser,baseURL})=>{
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();await page.goto(`${baseURL}/age-calculator`);
  await page.getByRole('button',{name:'Open calendar Date of birth',exact:true}).tap();
  const popup=page.getByRole('dialog',{name:'Open calendar Date of birth',exact:true});
  await expect(popup).toBeVisible();
  const bounds=await popup.boundingBox();expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width);
  await page.getByRole('button',{name:'Friday, June 16, 1995',exact:true}).tap();
  await expect(page.locator('input[name="birth"]').first()).toHaveValue('1995-06-16');
  await page.getByRole('button',{name:'Open calendar Date of birth',exact:true}).tap();
  await page.getByRole('button',{name:'1995 year'}).tap();
  await page.getByRole('searchbox',{name:'Search options'}).fill('200');
  const yearMenu=page.locator('[data-anchored-popover][data-trigger="Select"]');
  await expect(yearMenu).toHaveCSS('opacity','1');
  const years=await yearMenu.boundingBox();
  expect(years!.height).toBeLessThanOrEqual(360);
  await page.getByRole('option',{name:'2000',exact:true}).tap();
  await page.getByRole('button',{name:'Friday, June 16, 2000',exact:true}).tap();
  await expect(page.locator('input[name="birth"]').first()).toHaveValue('2000-06-16');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await context.close();
});
