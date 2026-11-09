import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {test, expect, request as requestFactory} from '@playwright/test';

// This workflow writes only to an explicitly configured disposable test app.
// Credentials never enter form fields, screenshots, videos, traces or attachments.
test.use({trace: 'off', screenshot: 'off', video: 'off', actionTimeout: 15_000, navigationTimeout: 30_000});
test.describe.serial('disposable blog publishing workflow', () => {
  test.skip(process.env.FINFLO_BLOG_E2E !== '1', 'Requires an explicitly enabled disposable database and test account.');

  test('sign in, edit privately, publish, unpublish, archive, restore and sign out', async ({page, context, browser}, testInfo) => {
    test.setTimeout(120_000);
    let privateState: Record<string, string> = {};
    if (!process.env.SUPER_ADMIN_EMAIL || !process.env.SUPER_ADMIN_PASSWORD || !process.env.SUPER_ADMIN_NAME) {
      try {privateState = JSON.parse(await readFile(process.env.FINFLO_BLOG_TEST_STATE || '/tmp/finflo-blog-test-state.json', 'utf8'));}
      catch {throw new Error('Provide the disposable blog test account through environment variables or FINFLO_BLOG_TEST_STATE.');}
    }
    const email = process.env.SUPER_ADMIN_EMAIL || privateState.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD || privateState.SUPER_ADMIN_PASSWORD;
    const authorName = process.env.SUPER_ADMIN_NAME || privateState.SUPER_ADMIN_NAME;
    const baseURL = String(testInfo.project.use.baseURL || process.env.TEST_URL || process.env.BETTER_AUTH_URL || privateState.BETTER_AUTH_URL || '');
    if (!email || !password || !authorName || !baseURL) throw new Error('The disposable blog test configuration is incomplete.');
    if (['finflo.org', 'www.finflo.org'].includes(new URL(baseURL).hostname)) throw new Error('Run editorial fixture tests against a disposable app, never the public Finflo site.');

    const authRequest = await requestFactory.newContext({baseURL});
    const publicRequest = await requestFactory.newContext({baseURL});
    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    const slug = `editorial-workflow-fixture-${randomUUID().slice(0, 8)}`;
    const title = `Local editorial workflow ${slug.slice(-8)}`;
    const editedTitle = `${title}: edited draft`;
    let editorPath: string | undefined;
    const content = `## A local worked example\n\nThis article exists only to verify the disposable publishing workflow. Twenty percent of 50 is 10.\n\n[Open the calculator](/percent-calculator)\n\n| Input | Result |\n| --- | --- |\n| 20% of 50 | 10 |\n\n<script>globalThis.__blogXss = true</script>\n\n<img src=x onerror="globalThis.__blogXss = true">\n\n[Unsafe link](javascript:alert('bad'))\n\n![Unsafe image](data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=)`;
    try {
      await page.goto(`${baseURL}/admin/sign-in`);
      await expect(page.getByRole('heading', {name: 'Super admin sign-in', exact: true})).toBeVisible();
      // A separate, untraced request context receives the password. Only its
      // HTTP-only session cookies are transferred into the browser context.
      let signedIn = false;
      try {
        const response = await authRequest.post('/api/auth/sign-in/email', {headers: {Origin: new URL(baseURL).origin}, data: {email, password, rememberMe: false}});
        signedIn = response.status() === 200;
      } catch {throw new Error('The disposable test sign-in endpoint was unreachable.');}
      if (!signedIn) throw new Error('The disposable test account could not sign in.');
      await context.addCookies((await authRequest.storageState()).cookies);
      await page.goto(`${baseURL}/admin`);
      await expect(page.getByRole('heading', {name: 'Publishing dashboard', exact: true})).toBeVisible();
      await page.getByRole('link', {name: 'Write an article', exact: true}).first().click();
      await page.getByLabel('Title', {exact: true}).fill(title);
      await page.locator('input[name="slug"]').fill(slug);
      await page.getByRole('combobox', {name: 'Category', exact: true}).selectOption('Math');
      await page.locator('textarea[name="excerpt"]').fill('A local fixture for the private editorial workflow and a checked percentage example.');
      await page.getByRole('textbox', {name: 'Article body', exact: true}).fill(content);
      await page.getByRole('button', {name: 'Save draft', exact: true}).click();
      await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]{36}$/);
      editorPath = new URL(page.url()).pathname;
      await expect(page.getByRole('heading', {name: 'Edit article', exact: true})).toBeVisible();
      expect((await publicRequest.get(`/blog/${slug}`)).status()).toBe(404);
      expect(await (await publicRequest.get('/sitemap.xml')).text()).not.toContain(`/blog/${slug}</loc>`);

      const competingEditor = await context.newPage();
      await competingEditor.goto(`${baseURL}${editorPath}`);
      await expect(competingEditor.getByLabel('Title', {exact: true})).toHaveValue(title);
      await page.getByLabel('Title', {exact: true}).fill(editedTitle);
      await page.getByRole('button', {name: 'Save draft', exact: true}).click();
      await expect(page.getByRole('status')).toContainText('Draft saved.');
      await competingEditor.getByLabel('Title', {exact: true}).fill(`${title}: stale overwrite attempt`);
      await competingEditor.getByRole('button', {name: 'Save draft', exact: true}).click();
      await expect(competingEditor.getByRole('alert').filter({hasText: 'This post changed while you were editing.'})).toBeVisible();
      // Explicitly accept leaving the stale tab's unsaved local copy.
      competingEditor.once('dialog', dialog => dialog.accept());
      await competingEditor.getByRole('link', {name: 'reloading the latest version', exact: true}).click();
      await expect(competingEditor.getByLabel('Title', {exact: true})).toHaveValue(editedTitle);
      await competingEditor.close();
      await page.getByRole('link', {name: 'Saved preview', exact: true}).click();
      await expect(page.getByRole('heading', {name: editedTitle, exact: true})).toBeVisible();
      await expect(page.locator('[data-blog-markdown]')).toContainText('Twenty percent of 50 is 10.');
      expect(await (await publicRequest.get(`${editorPath}/preview`, {maxRedirects: 0})).headers().location).toMatch(/\/admin\/sign-in/);
      await page.getByRole('link', {name: 'Return to editor', exact: true}).click();
      await page.getByRole('button', {name: 'Publish article', exact: true}).click();
      await expect(page.getByRole('status')).toContainText('Article saved and published.');
      await expect(page.locator('input[name="slug"]')).toHaveAttribute('readonly', '');

      const live = await publicPage.goto(`${baseURL}/blog/${slug}`);
      expect(live?.status()).toBe(200);
      await expect(publicPage.getByRole('heading', {level: 1, name: editedTitle, exact: true})).toBeVisible();
      await expect(publicPage.getByText(`By ${authorName}`, {exact: true})).toBeVisible();
      const markdown = publicPage.locator('[data-blog-markdown]');
      await expect(markdown.getByRole('heading', {name: 'A local worked example', exact: true})).toBeVisible();
      await expect(markdown.getByRole('table')).toHaveCount(1);
      await expect(markdown.locator('script, img[src="x"], a[href^="javascript:"], img[src^="data:"]')).toHaveCount(0);
      expect(await publicPage.evaluate(() => '__blogXss' in globalThis)).toBe(false);
      const firstPublication = await publicPage.locator('article time').first().getAttribute('datetime');
      expect(firstPublication).toBeTruthy();
      expect(await (await publicRequest.get('/sitemap.xml')).text()).toContain(`/blog/${slug}</loc>`);
      expect(await (await publicRequest.get('/blog')).text()).toContain(editedTitle);

      // Saving an already-published article must retain publication status.
      await page.locator('textarea[name="excerpt"]').fill('An updated local fixture excerpt while the article remains published.');
      await page.getByRole('button', {name: 'Save changes', exact: true}).click();
      await expect(page.getByRole('status')).toContainText('Article saved and published.');
      expect((await publicRequest.get(`/blog/${slug}`)).status()).toBe(200);
      await page.getByRole('button', {name: 'Unpublish', exact: true}).click();
      await expect(page.getByRole('status')).toContainText('It is no longer public.');
      expect((await publicRequest.get(`/blog/${slug}`)).status()).toBe(404);
      expect(await (await publicRequest.get('/sitemap.xml')).text()).not.toContain(`/blog/${slug}</loc>`);
      expect(await (await publicRequest.get('/blog')).text()).not.toContain(editedTitle);
      await expect(page.locator('input[name="slug"]')).toHaveAttribute('readonly', '');

      await page.getByRole('button', {name: 'Archive', exact: true}).click();
      await expect(page.getByRole('status')).toContainText('Article archived.');
      await page.reload();
      await expect(page.getByText('archived', {exact: true})).toBeVisible();
      await page.getByRole('button', {name: 'Save draft', exact: true}).click();
      await expect(page.getByRole('status')).toContainText('Draft saved.');
      await page.getByRole('button', {name: 'Publish article', exact: true}).click();
      await expect(page.getByRole('status')).toContainText('Article saved and published.');
      await publicPage.goto(`${baseURL}/blog/${slug}`);
      expect(await publicPage.locator('article time').first().getAttribute('datetime')).toBe(firstPublication);

      // Leave the disposable fixture archived rather than publicly listed.
      await page.getByRole('button', {name: 'Archive', exact: true}).click();
      await expect(page.getByRole('status')).toContainText('Article archived.');
      expect((await publicRequest.get(`/blog/${slug}`)).status()).toBe(404);
      await page.getByRole('button', {name: 'Sign out', exact: true}).click();
      await expect(page).toHaveURL(/\/admin\/sign-in$/);
      await page.goto(`${baseURL}/admin/posts`);
      await expect(page).toHaveURL(/\/admin\/sign-in$/);
    } finally {
      // Best-effort recovery after a failed assertion, confined to this fixture.
      if (editorPath) try {
        await page.goto(`${baseURL}${editorPath}`);
        const archive = page.getByRole('button', {name: 'Archive', exact: true});
        if (await archive.isVisible()) {await archive.click(); await expect(page.getByRole('status')).toContainText('Article archived.');}
      } catch { /* The disposable database is torn down by the test runner. */ }
      await Promise.allSettled([authRequest.dispose(), publicRequest.dispose(), publicContext.close()]);
    }
  });
});
