import {test, expect} from '@playwright/test';

test('mobile navigation handles desktop resizing, keyboard focus and outside dismissal', async ({page}) => {
  await page.route('**/pagead2.googlesyndication.com/**', route => route.fulfill({contentType: 'application/javascript', body: ''}));
  await page.setViewportSize({width: 1100, height: 900});
  await page.goto('/calculators/finance');
  const trigger = page.locator('header button[aria-controls="mobile-nav"]');
  const menu = page.getByRole('navigation', {name: 'Mobile navigation'});
  await trigger.click();
  await expect(menu.getByRole('link', {name: 'Calculators', exact: true})).toHaveAttribute('aria-current', 'page');
  await page.setViewportSize({width: 1280, height: 900});
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeHidden();
  await expect(page.getByRole('navigation', {name: 'Main navigation'})).toBeVisible();

  await page.setViewportSize({width: 390, height: 844});
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.focus();
  await trigger.press('Enter');
  await page.keyboard.press('Tab');
  await expect(menu.getByRole('link', {name: 'Calculators', exact: true})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.press('Enter');
  await trigger.press('Shift+Tab');
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole('button', {name: 'Search calculators', exact: true})).toBeFocused();
  await trigger.click();
  await page.mouse.click(5, 300);
  await expect(menu).toHaveCount(0);
  await expect(page).toHaveURL(/\/calculators\/finance$/);
  await trigger.click();
  await menu.getByText('Main navigation').click();
  await expect(menu).toBeVisible();
  await menu.getByRole('link', {name: 'Spin wheels', exact: true}).click();
  await expect(page).toHaveURL(/\/spin-wheels$/);
  await expect(menu).toHaveCount(0);
});
