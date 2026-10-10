import {test,expect} from '@playwright/test';

test('desktop print keeps its native action and offers PDF if printing is unavailable',async({page})=>{
  await page.goto('/grade-calculator');
  await page.evaluate(()=>{
    window.print=()=>{
      document.body.dataset.printRequested='true';
      throw new Error('No print service');
    };
  });
  await page.getByRole('button',{name:'Print',exact:true}).click();
  await expect(page.locator('body')).toHaveAttribute('data-print-requested','true');
  await expect(page.getByText('If printing does not open, select PDF to save a printable file.')).toBeVisible();
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'PDF',exact:true}).click();
  expect((await pending).suggestedFilename()).toBe('finflo-grade-calculator.pdf');
});
