import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('final grades explain impossible and secured targets without out-of-range score cards',async({page})=>{
 await page.goto('/final-exam-grade-calculator');
 await page.getByRole('button',{name:'Calculate',exact:true}).click();
 await expect(page.locator('.primary-metric dd')).toHaveText('Target not attainable');
 await expect(page.locator('.result-metrics')).toContainText('89.5%');
 await expect(page.locator('.result-notes')).toContainText('more than 100%');
 const pending=page.waitForEvent('download');
 await page.getByRole('button',{name:'CSV',exact:true}).click();
 const download=await pending;
 const csv=await readFile((await download.path())!,'utf8');
 expect(csv).toContain('Target not attainable');expect(csv).not.toContain('101.666');
 await page.locator('#final-target').fill('85');
 await page.getByRole('button',{name:'Calculate',exact:true}).click();
 await expect(page.locator('.primary-metric dd')).toHaveText('85%');
 await page.locator('#final-target').fill('30');
 await page.getByRole('button',{name:'Calculate',exact:true}).click();
 await expect(page.locator('.primary-metric dd')).toHaveText('Target already secured');
 await expect(page.locator('.result-metrics')).toContainText('0%');
});

test('percentages above 100 remain valid when they measure growth',async({page})=>{
 await page.goto('/percent-calculator');
 await page.locator('#calculation-mode').click();
 await page.getByRole('option',{name:'Percentage change',exact:true}).click();
 await page.locator('#change-from').fill('3');
 await page.locator('#change-to').fill('10');
 await page.getByRole('button',{name:'Calculate',exact:true}).click();
 await expect(page.locator('.primary-metric dd')).toHaveText('233.33%');
});

test('matrix cards, expanded tables and CSV use the same display precision',async({page})=>{
 await page.goto('/matrix-calculator');
 await page.locator('#matrix-operation').click();
 await page.getByRole('option',{name:'Inverse of A',exact:true}).click();
 await page.locator('#matrix-a').fill('3, 0\n0, 7');
 await page.getByRole('button',{name:'Calculate',exact:true}).click();
 await expect(page.locator('.primary-metric dd')).toHaveText('0.33  0\n0  0.14');
 await expect(page.locator('#calculation-table tbody tr').first().locator('td').first()).toHaveText('0.33');
 const pending=page.waitForEvent('download');
 await page.getByRole('button',{name:'CSV',exact:true}).click();
 const download=await pending;
 const csv=await readFile((await download.path())!,'utf8');
 expect(csv).toContain('"0.33","0"');expect(csv).toContain('"0","0.14"');
 expect(csv).not.toContain('0.333333');
});

test('Hindi final-grade warnings fit a narrow screen and show translated guidance',async({page})=>{
 await page.setViewportSize({width:360,height:800});
 await page.goto('/hi/final-exam-grade-calculator');
 await page.getByRole('button',{name:'गणना करें',exact:true}).click();
 await expect(page.locator('.primary-metric dd')).toHaveText('लक्ष्य प्राप्त करना संभव नहीं');
 await expect(page.locator('.result-notes')).toContainText('100% से अधिक');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
