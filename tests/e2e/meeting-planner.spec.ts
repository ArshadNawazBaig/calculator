import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function sourceDate(page:Page,date:string) {
  const [year,month,day]=date.split('-');
  for (const [segment,value] of [['year',year],['month',month],['day',day]]) {
    const input=page.getByRole('spinbutton',{name:`${segment}, Source date`,exact:true});
    await input.focus();await input.pressSequentially(value);
  }
}

test('meeting comparison keeps full dates and day changes usable on mobile',async({page})=>{
  await page.setViewportSize({width:360,height:844});
  await page.goto('/time/asia-karachi');
  await sourceDate(page,'2026-11-09');
  await page.locator('#meeting-time').fill('23:30');
  await page.locator('#meeting-destination').click();
  await page.getByRole('combobox',{name:'Search options',exact:true}).fill('Tokyo');
  await page.getByRole('option',{name:'Tokyo · Asia/Tokyo',exact:true}).click();
  await page.getByRole('button',{name:'Compare times',exact:true}).click();
  await expect(page.locator('[data-meeting-result]')).toContainText('Nov 10, 2026');
  await expect(page.locator('[data-meeting-result]')).toContainText('03:30');
  await expect(page.locator('[data-meeting-summary]')).toContainText('4 hours ahead');
  await expect(page.locator('[data-meeting-summary]')).toContainText('one calendar day later');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect((await new AxeBuilder({page}).include('[data-meeting-planner]').analyze()).violations).toEqual([]);
});

test('meeting comparison rejects missing times and asks which repeated occurrence to use',async({page})=>{
  await page.goto('/time/america-new-york');
  await sourceDate(page,'2026-03-08');
  await page.locator('#meeting-time').fill('02:30');
  await page.getByRole('button',{name:'Compare times',exact:true}).click();
  await expect(page.locator('[data-meeting-planner] [role="alert"]')).toContainText('does not exist');
  await sourceDate(page,'2026-11-01');
  await page.locator('#meeting-time').fill('01:30');
  await page.getByRole('button',{name:'Compare times',exact:true}).click();
  await expect(page.locator('[data-meeting-planner] [role="alert"]')).toContainText('occurs twice');
  await page.locator('#meeting-occurrence').click();
  await page.getByRole('option',{name:'Later occurrence',exact:true}).click();
  await page.getByRole('button',{name:'Compare times',exact:true}).click();
  await expect(page.locator('[data-meeting-result]')).toContainText('2026-11-01 06:30:00 UTC');
});
