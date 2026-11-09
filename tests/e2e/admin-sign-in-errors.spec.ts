import {test, expect} from '@playwright/test';

// Responses are intercepted: these tests never submit a real account password.
const cases = [
  {status: 401, message: 'Email or password is incorrect.'},
  {status: 403, message: 'This address is not allowed for sign-in. Open the configured site address and try again.'},
  {status: 429, message: 'Too many attempts. Wait a few minutes before trying again.'},
  {status: 503, message: 'Sign-in is temporarily unavailable. Please try again shortly.'},
];

for (const {status, message} of cases) {
  test(`administrator sign-in explains HTTP ${status} without misclassifying the failure`, async ({page}) => {
    let intercepted = 0;
    await page.route('**/api/auth/sign-in/email', async route => {
      intercepted++;
      await route.fulfill({status, contentType: 'application/json', body: JSON.stringify({message: 'Provider response must not dictate the UI explanation.'})});
    });
    await page.goto('/admin/sign-in');
    await page.getByLabel('Email address', {exact: true}).fill('test@example.invalid');
    await page.getByLabel('Password', {exact: true}).fill('Fictional-password-for-UI-checks');
    await page.getByRole('button', {name: 'Sign in', exact: true}).click();
    await expect(page.getByRole('alert').filter({hasText: message})).toBeVisible();
    expect(intercepted).toBe(1);
    await expect(page.getByRole('button', {name: 'Sign in', exact: true})).toBeEnabled();
    await expect(page).toHaveURL(/\/admin\/sign-in$/);
  });
}
