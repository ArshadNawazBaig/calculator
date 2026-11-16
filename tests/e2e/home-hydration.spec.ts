import {test, expect} from '@playwright/test';
import {languages} from '../../src/lib/i18n/config';

// Run against next dev to include React's attribute mismatch diagnostics.
for (const locale of ['en', 'ar', 'hi'] as const) {
  test(`${locale}: screenshots preserve input attributes before homepage hydration`, async ({page}) => {
    const errors: string[] = [];
    page.on('console', message => {
      if (message.type() === 'error' && /hydrat|didn.t match/i.test(message.text())) errors.push(message.text());
    });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://pagead2.googlesyndication.com/**', route => route.abort());

    let releaseScripts!: () => void;
    const scriptsReady = new Promise<void>(resolve => {releaseScripts = resolve;});
    await page.route('**/_next/static/**/*.js', async route => {
      await scriptsReady;
      await route.continue();
    });
    const navigation = page.goto(locale === 'en' ? '/' : `/${locale}`, {waitUntil: 'domcontentloaded'});
    const search = page.locator('main input[role="combobox"]');
    const slider = page.locator('#percentage-demo-rate');
    const demo = page.locator('section[aria-labelledby="percentage-demo-title"]');
    try {
      await expect(slider).toBeDisabled();
      await search.fill('mortgage');
      const mutations = await page.evaluateHandle(() => {
        const changes: string[] = [];
        const observer = new MutationObserver(records => {
          for (const record of records) {
            if (record.target instanceof HTMLInputElement) {
              changes.push(`${record.target.id}: ${record.oldValue} -> ${record.target.getAttribute('style')}`);
            }
          }
        });
        observer.observe(document, {subtree: true, attributes: true, attributeFilter: ['style'], attributeOldValue: true});
        return {changes, stop: () => observer.disconnect()};
      });
      try {
        // Both page and section captures otherwise hide every input's caret.
        await page.screenshot({caret: 'initial'});
        await demo.screenshot({caret: 'initial'});
        expect(await mutations.evaluate(value => value.changes)).toEqual([]);
      } finally {
        await mutations.evaluate(value => value.stop());
        await mutations.dispose();
      }
    } finally {
      releaseScripts();
    }
    await navigation;
    await expect(slider).toBeEnabled();
    await expect(search).toHaveValue('mortgage');
    await search.press('ArrowDown');
    await expect(page.getByRole('option').first()).toBeVisible();
    await search.press('Escape');
    await slider.fill('25');
    await expect(demo.locator('output').last()).toHaveText(new Intl.NumberFormat(languages[locale].tag).format(93.75));
    expect(errors).toEqual([]);
  });
}
