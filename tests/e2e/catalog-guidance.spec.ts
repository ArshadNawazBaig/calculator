import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import content from '../../src/data/calculator-content.json';
import type {GuidanceSection} from '../../src/components/content/calculator-guidance';

const representativePages = [
  'mortgage-calculator', 'retirement-calculator', 'tax-calculator',
  'bmi-calculator', 'gfr-calculator', 'pregnancy-calculator',
  'fraction-calculator', 'probability-calculator', 'triangle-calculator',
  'time-card-calculator', 'concrete-calculator', 'ip-subnet-calculator',
  'btu-calculator', 'shoe-size-conversion', 'final-exam-grade-calculator',
] as const;

test.describe('expanded guidance in the initial mobile HTML', () => {
  test.use({javaScriptEnabled: false, viewport: {width: 390, height: 844}});

  for (const slug of representativePages) {
    test(`${slug}: explanations, tables, navigation and answers`, async ({page}) => {
      const entry: {sections: GuidanceSection[]; faqs: {question: string; answer: string}[]} = content[slug];
      const response = await page.goto(`/${slug}`, {waitUntil: 'domcontentloaded'});
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      const sections = page.locator('section[id^="understanding-"]');
      await expect(sections).toHaveCount(entry.sections.length);
      const links = page.locator('[data-calculator-guide-nav] a');
      await expect(links).toHaveCount(entry.sections.length);
      for (const [index, section] of entry.sections.entries()) {
        await expect(sections.nth(index).locator('h2')).toHaveText(section.title);
        await expect(links.nth(index)).toHaveAttribute('href', `#understanding-${index + 1}`);
        if (section.table) {
          const table = sections.nth(index).getByRole('table', {name: section.table.caption, exact: true});
          await expect(table).toBeVisible();
          await expect(table.locator('thead th[scope="col"]')).toHaveCount(section.table.headers.length);
          await expect(table.locator('tbody th[scope="row"]')).toHaveCount(section.table.rows.length);
        }
      }
      const questions = page.locator('#common-questions details');
      await expect(questions).toHaveCount(entry.faqs.length);
      await questions.first().locator('summary').click();
      await expect(questions.first().locator('p')).toHaveText(entry.faqs[0].answer);
      await links.last().click();
      await expect(sections.last().locator('h2')).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    });
  }
});

test('expanded content retains accessible navigation and tables after hydration', async ({page}) => {
  await page.route('https://pagead2.googlesyndication.com/**', route => route.abort());
  for (const slug of ['mortgage-calculator', 'ip-subnet-calculator']) {
    await page.goto(`/${slug}`);
    await expect(page.locator('[data-calculator-guide-nav]')).toBeVisible();
    const results = await new AxeBuilder({page}).include('.tool-reading').analyze();
    expect(results.violations).toEqual([]);
  }
});
