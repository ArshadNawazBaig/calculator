import {test, expect, type BrowserContext, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {disposableBlogState, signInDisposableBlog} from './helpers/disposable-blog';

// These tests use an isolated local account. No credentials or private article
// contents are retained in Playwright artifacts, including on failure.
test.use({trace: 'off', screenshot: 'off', video: 'off'});
test.describe('Finflo visual article editor', () => {
  test.skip(process.env.FINFLO_BLOG_E2E !== '1', 'Requires the explicitly marked disposable local database.');
  let baseURL = '';
  let cookies: Parameters<BrowserContext['addCookies']>[0] = [];
  test.beforeAll(async ({browser}, testInfo) => {
    const state = await disposableBlogState(testInfo);
    baseURL = state.baseURL;
    const session = await browser.newContext();
    try {
      await signInDisposableBlog(session, state);
      cookies = await session.cookies();
    } finally {
      await session.close();
    }
  });
  test.beforeEach(async ({page, context}) => {
    await context.addCookies(cookies);
    await page.goto(`${baseURL}/admin/posts/new`);
    await expect(page.getByRole('textbox', {name: 'Article body', exact: true})).toHaveAttribute('contenteditable', 'true');
  });

  async function writeSource(page: Page, content: string) {
    await page.getByRole('button', {name: 'Markdown source', exact: true}).click();
    await page.getByRole('textbox', {name: 'Markdown source', exact: true}).fill(content);
    await page.getByRole('button', {name: 'Write', exact: true}).click();
    return page.getByRole('textbox', {name: 'Article body', exact: true});
  }

  test('writes formatted text using Finflo controls and supports undo, redo and safe reader preview', async ({page}) => {
    const body = page.getByRole('textbox', {name: 'Article body', exact: true});
    await expect(page.locator('textarea[name="content"]')).toBeHidden();
    await body.fill('Check the assumptions before using a result.');
    await body.press('ControlOrMeta+A');
    await page.getByRole('button', {name: 'Bold', exact: true}).click();
    await expect(body.locator('strong')).toHaveText('Check the assumptions before using a result.');
    await page.getByRole('button', {name: 'Undo', exact: true}).click();
    await expect(body.locator('strong')).toHaveCount(0);
    await expect(body).toContainText('Check the assumptions');
    await page.getByRole('button', {name: 'Redo', exact: true}).click();
    await expect(body.locator('strong')).toHaveCount(1);
    await page.getByRole('button', {name: 'Italic', exact: true}).click();
    await expect(body.locator('em')).toHaveCount(1);
    await page.getByRole('button', {name: 'Strikethrough', exact: true}).click();
    await expect(body.locator('s')).toHaveCount(1);

    await writeSource(page, 'A worked example');
    await body.click();
    await page.getByRole('button', {name: /Text style$/}).click();
    await page.getByRole('option', {name: 'Heading 2', exact: true}).click();
    await expect(body.getByRole('heading', {level: 2})).toHaveText('A worked example');
    await page.getByRole('button', {name: /Text style$/}).click();
    await page.getByRole('option', {name: 'Heading 3', exact: true}).click();
    await expect(body.getByRole('heading', {level: 3})).toHaveText('A worked example');

    await writeSource(page, 'A useful checklist');
    await body.click();
    await page.getByRole('button', {name: 'Bullet list', exact: true}).click();
    await expect(body.locator('ul li')).toHaveText('A useful checklist');
    await page.getByRole('button', {name: 'Numbered list', exact: true}).click();
    await expect(body.locator('ol li')).toHaveText('A useful checklist');

    await writeSource(page, '- [x] Check the formula\n- [ ] Check the units');
    await expect(body.getByRole('checkbox').first()).toBeChecked();
    await expect(body.getByRole('checkbox').nth(1)).not.toBeChecked();
    await body.getByRole('checkbox').nth(1).check();
    await page.getByRole('button', {name: 'Markdown source', exact: true}).click();
    await expect(page.getByRole('textbox', {name: 'Markdown source', exact: true})).toHaveValue(/- \[x\] Check the formula[\s\S]*- \[x\] Check the units/);
    await page.getByRole('button', {name: 'Write', exact: true}).click();

    await writeSource(page, 'State the limitation.');
    await body.click();
    await page.getByRole('button', {name: 'Blockquote', exact: true}).click();
    await expect(body.locator('blockquote')).toHaveText('State the limitation.');
    await writeSource(page, 'result = principal * rate');
    await body.click();
    await page.getByRole('button', {name: 'Code block', exact: true}).click();
    await expect(body.locator('pre code')).toHaveText('result = principal * rate');
    await page.getByRole('button', {name: 'Markdown source', exact: true}).click();
    await expect(page.getByRole('textbox', {name: 'Markdown source', exact: true})).toHaveValue(/```[\s\S]*result = principal \* rate[\s\S]*```/);
    await page.getByRole('button', {name: 'Preview', exact: true}).click();
    await expect(page.locator('[data-blog-markdown] pre code')).toHaveText('result = principal * rate');
  });

  test('inserts safe links, informative images and editable GFM tables without accepting active URLs', async ({page}) => {
    const body = await writeSource(page, 'Source: ');
    await body.click();
    await body.press('ControlOrMeta+End');
    await body.press('ControlOrMeta+K');
    await expect(page.getByRole('region', {name: 'Link settings', exact: true})).toBeVisible();
    const headerSearch = page.getByRole('dialog', {name: 'Find a calculator', exact: true});
    await expect.soft(headerSearch).toHaveCount(0);
    // Continue checking the insertion controls after reporting a shortcut
    // regression, so one failure cannot hide broken image/table behavior.
    if (await headerSearch.isVisible()) await page.getByRole('button', {name: 'Close search', exact: true}).click();
    await page.getByRole('textbox', {name: 'Link URL', exact: true}).fill('javascript:alert(1)');
    await page.getByRole('textbox', {name: 'Link text', exact: true}).fill('Unsafe source');
    await page.getByRole('button', {name: 'Apply link', exact: true}).click();
    await expect(body.locator('a')).toHaveCount(0);
    await page.getByRole('textbox', {name: 'Link URL', exact: true}).fill('/percent-calculator');
    await page.getByRole('textbox', {name: 'Link text', exact: true}).fill('Percentage calculator');
    await page.getByRole('button', {name: 'Apply link', exact: true}).click();
    await expect.soft(body.locator('a')).toHaveAttribute('href', '/percent-calculator');

    await body.press('ControlOrMeta+End');
    await body.press('Enter');
    await page.getByRole('button', {name: 'Insert image', exact: true}).click();
    await page.getByRole('textbox', {name: 'Image URL', exact: true}).fill('data:image/svg+xml,<svg onload="alert(1)"/>');
    await page.getByRole('textbox', {name: 'Alternative text', exact: true}).fill('A clearly labelled chart');
    // The panel action shares its name with the toolbar; the last button is
    // the panel's explicit confirmation, not a native browser prompt.
    await page.getByRole('button', {name: 'Insert image', exact: true}).last().click();
    await expect(body.locator('img')).toHaveCount(0);
    await page.getByRole('textbox', {name: 'Image URL', exact: true}).fill('/og.png');
    await page.getByRole('textbox', {name: 'Alternative text', exact: true}).fill('');
    await page.getByRole('button', {name: 'Insert image', exact: true}).last().click();
    await expect(body.locator('img')).toHaveCount(0);
    await page.getByRole('textbox', {name: 'Alternative text', exact: true}).fill('Finflo calculator example');
    await page.getByRole('button', {name: 'Insert image', exact: true}).last().click();
    await expect(body.getByRole('img', {name: 'Finflo calculator example', exact: true})).toHaveAttribute('src', '/og.png');

    await body.press('ControlOrMeta+End');
    await body.press('Enter');
    await page.getByRole('button', {name: 'Insert table', exact: true}).click();
    await expect(body.getByRole('table')).toHaveCount(1);
    await expect(page.getByRole('button', {name: /Text style$/})).toBeDisabled();
    await expect(page.getByRole('button', {name: 'Blockquote', exact: true})).toBeDisabled();
    await expect(page.getByRole('button', {name: 'Code block', exact: true})).toBeDisabled();
    await expect(page.getByRole('button', {name: 'Bold', exact: true})).toBeEnabled();
    const rows = await body.locator('tr').count();
    await page.getByRole('button', {name: 'Add row after', exact: true}).click();
    await expect(body.locator('tr')).toHaveCount(rows + 1);
    const cells = await body.locator('tr').first().locator('th, td').count();
    await page.getByRole('button', {name: 'Add column after', exact: true}).click();
    await expect(body.locator('tr').first().locator('th, td')).toHaveCount(cells + 1);
    await body.locator('tr').nth(1).locator('td').first().click();
    await page.keyboard.type('First line');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('Second line');
    await page.getByRole('button', {name: 'Paragraph after table', exact: true}).click();
    await page.keyboard.type('Read the result alongside its assumptions.');
    await page.getByRole('button', {name: 'Preview', exact: true}).click();
    const preview = page.locator('[data-blog-markdown]');
    await expect.soft(preview.getByRole('link', {name: 'Percentage calculator', exact: true})).toHaveAttribute('href', '/percent-calculator');
    await expect(preview.getByRole('img', {name: 'Finflo calculator example', exact: true})).toBeVisible();
    await expect(preview.getByRole('table')).toHaveCount(1);
    await expect(preview.getByRole('cell', {name: 'First line Second line', exact: true})).toBeVisible();
    await expect(preview.getByRole('cell', {name: 'First line Second line', exact: true}).locator('br')).toHaveCount(1);
    await expect(preview).toContainText('Read the result alongside its assumptions.');
    await expect(preview.locator('a[href^="javascript:"], img[src^="data:"]')).toHaveCount(0);
  });

  test('cleans pasted HTML and unsafe Markdown before the editable surface can run it', async ({page}) => {
    const body = await writeSource(page, '## Safe heading\n\nUseful **text**.\n\n<script>globalThis.__articleEditorXss = true</script>\n\n<img src="x" onerror="globalThis.__articleEditorXss = true">\n\n[Unsafe](javascript:alert(1))\n\n![Unsafe](data:image/svg+xml,attack)');
    await expect(body.getByRole('heading', {name: 'Safe heading', exact: true})).toBeVisible();
    await expect(body.locator('script, iframe, object, embed, img[src="x"], a[href^="javascript:"], img[src^="data:"]')).toHaveCount(0);
    expect(await page.evaluate(() => '__articleEditorXss' in globalThis)).toBe(false);
    await body.press('ControlOrMeta+End');
    await body.evaluate(element => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/html', '<p onclick="globalThis.__articleEditorXss = true">Pasted <strong>useful text</strong><script>globalThis.__articleEditorXss = true</script><a href="javascript:alert(1)">unsafe</a><img src="x" onerror="globalThis.__articleEditorXss = true"><iframe src="https://example.com"></iframe></p>');
      clipboardData.setData('text/plain', 'Pasted useful text');
      element.dispatchEvent(new ClipboardEvent('paste', {bubbles: true, cancelable: true, clipboardData}));
    });
    await expect(body).toContainText('Pasted useful text');
    await expect(body.locator('[onclick], [onerror], script, iframe, object, embed, img[src="x"], a[href^="javascript:"]')).toHaveCount(0);
    expect(await page.evaluate(() => '__articleEditorXss' in globalThis)).toBe(false);
    await page.getByRole('button', {name: 'Preview', exact: true}).click();
    await expect(page.locator('[data-blog-markdown]')).toContainText('Pasted useful text');
    await expect(page.locator('[data-blog-markdown] script, [data-blog-markdown] a[href^="javascript:"]')).toHaveCount(0);
  });

  test('keeps document fields and publishing disabled until the editor hydrates', async ({context}, testInfo) => {
    const state = await disposableBlogState(testInfo);
    const page = await context.newPage();
    let release: () => void = () => {};
    const held = new Promise<void>(resolve => {release = resolve;});
    await page.route('**/_next/static/**/*.js', async route => {await held; await route.continue();});
    try {
      await page.goto(`${state.baseURL}/admin/posts/new`, {waitUntil: 'commit'});
      await expect(page.getByRole('textbox', {name: 'Title', exact: true})).toBeDisabled();
      await expect(page.getByRole('button', {name: 'Save draft', exact: true})).toBeDisabled();
      await expect(page.getByRole('button', {name: 'Publish article', exact: true})).toBeDisabled();
      await expect(page.locator('[data-rich-article-editor][contenteditable="true"]')).toHaveCount(0);
    } finally {
      release();
    }
    await expect(page.getByRole('textbox', {name: 'Title', exact: true})).toBeEnabled();
    await expect(page.getByRole('textbox', {name: 'Article body', exact: true})).toHaveAttribute('contenteditable', 'true');
    await expect(page.getByRole('button', {name: 'Save draft', exact: true})).toBeEnabled();
    await page.close();
  });

  test('preserves footnotes in source mode instead of silently dropping them during a visual edit', async ({page}) => {
    const content = 'Check the assumptions[^note].\n\n[^note]: This source note has useful context for the reader.';
    const body = await writeSource(page, content);
    await expect(body).toHaveAttribute('contenteditable', 'false');
    await expect(body).toHaveAttribute('aria-readonly', 'true');
    await expect(page.getByText('Footnotes are preserved. Use Markdown source to edit this article.', {exact: true})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Bold', exact: true})).toBeDisabled();
    await page.getByRole('button', {name: 'Markdown source', exact: true}).click();
    await expect(page.getByRole('textbox', {name: 'Markdown source', exact: true})).toHaveValue(content);
    await page.getByRole('button', {name: 'Preview', exact: true}).click();
    await expect(page.locator('[data-blog-markdown] [data-footnotes]')).toContainText('This source note has useful context for the reader.');
    await page.getByRole('button', {name: 'Markdown source', exact: true}).click();
    await page.getByRole('textbox', {name: 'Markdown source', exact: true}).fill('Now a plain paragraph.');
    await page.getByRole('button', {name: 'Write', exact: true}).click();
    await expect(body).toHaveAttribute('contenteditable', 'true');
    await expect(page.getByRole('button', {name: 'Bold', exact: true})).toBeEnabled();
    await body.press('ControlOrMeta+End');
    await body.evaluate((element, markdown) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', markdown);
      element.dispatchEvent(new ClipboardEvent('paste', {bubbles: true, cancelable: true, clipboardData}));
    }, content);
    await expect(page.getByRole('alert').filter({hasText: /footnote/i})).toBeVisible();
    await page.getByRole('button', {name: 'Markdown source', exact: true}).click();
    await expect(page.getByRole('textbox', {name: 'Markdown source', exact: true})).toHaveValue('Now a plain paragraph.');
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`keeps the ${theme} dashboard usable by keyboard and at 360 pixels`, async ({page}) => {
      await page.setViewportSize({width: 360, height: 844});
      await page.evaluate(value => {localStorage.setItem('finflo.theme.v1', value); document.documentElement.dataset.theme = value;}, theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.getByRole('heading', {level: 1})).toHaveCount(1);
      await expect(page.getByRole('textbox', {name: 'Article body', exact: true})).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect((await new AxeBuilder({page}).include('main').analyze()).violations).toEqual([]);
      await page.getByRole('button', {name: /Text style$/}).focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('listbox')).toHaveCount(0);
      await page.getByRole('button', {name: 'Bold', exact: true}).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('button', {name: 'Bold', exact: true})).toHaveAttribute('aria-pressed', 'true');
      await page.getByRole('textbox', {name: 'Article body', exact: true}).fill('Accessible writing controls');
      await expect(page.getByRole('textbox', {name: 'Article body', exact: true})).toContainText('Accessible writing controls');
    });
  }
});
