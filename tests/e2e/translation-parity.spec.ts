import {readFile} from 'node:fs/promises';
import {test, expect} from '@playwright/test';
import {locales, translator} from '../../src/lib/i18n/config';

for (const locale of locales.filter(locale => locale !== 'en')) {
  test(`updated calculator, guide and meeting planner work in ${locale}`, async ({page}) => {
    test.setTimeout(120000);
    const messages = {
      ...JSON.parse(await readFile(`src/data/locales/content/${locale}.json`, 'utf8')),
      ...JSON.parse(await readFile(`src/data/locales/${locale}.json`, 'utf8')),
    };
    const t = translator(messages);
    const required = ['Triangle: 3 sides', 'Two offers on a $120 item, before tax and delivery', 'Plan a time from this location', 'Source clock time', 'Compare times', 'Comparison updated. Both rows refer to the same instant.'];
    for (const key of required) {
      expect(messages[key]?.trim(), `${locale}: ${key}`).toBeTruthy();
      expect(messages[key], `${locale}: untranslated ${key}`).not.toBe(key);
    }
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /hydrat|didn.t match/i.test(message.text())) errors.push(message.text());
    });

    await page.goto(`/${locale}/area-calculator`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    const triangle = page.getByRole('button', {name: t('Triangle: 3 sides'), exact: true});
    await triangle.click();
    await expect(triangle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#calculator-inputs')).toHaveAttribute('data-mode', 'triangle-sss');
    await expect(page.locator('[data-geometry-guide] summary')).toHaveText(t('Which measurements do I need?'));
    await expect(page.locator('[data-math-search-content]')).toContainText(t('Area formulas and examples by shape'));

    await page.goto(`/${locale}/guides/comparing-discounts-and-percentage-changes`);
    const comparisonTable = page.getByRole('table').filter({hasText: t('Two offers on a $120 item, before tax and delivery')});
    await expect(comparisonTable).toBeVisible();
    await expect(comparisonTable.getByRole('columnheader', {name: t('Offer'), exact: true})).toBeVisible();
    await expect(comparisonTable.getByRole('rowheader', {name: t('Shop B: 20% off, then $10'), exact: true})).toBeVisible();

    await page.goto(`/${locale}/time/asia-karachi`);
    const planner = page.locator('[data-meeting-planner]');
    await expect(planner.getByRole('heading', {name: t('Plan a time from this location'), exact: true})).toBeVisible();
    await planner.getByLabel(t('Source clock time'), {exact: true}).fill('13:45');
    await planner.getByRole('button', {name: t('Compare times'), exact: true}).click();
    await expect(planner.getByRole('status')).toHaveText(t('Comparison updated. Both rows refer to the same instant.'));
    await expect(planner.getByRole('columnheader', {name: t('Local date and time'), exact: true})).toBeVisible();
    await expect(planner.locator('[data-meeting-result] tbody tr').first().locator('td time')).toHaveAttribute('datetime', /T08:45:00\.000Z$/);
    await expect(planner.getByRole('alert')).toBeEmpty();
    expect(errors).toEqual([]);
  });
}
