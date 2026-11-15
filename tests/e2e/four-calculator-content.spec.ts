import {test, expect, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  {slug: 'grade-calculator', title: 'Weighted Grade Calculator: Categories & Points', sections: 7, tables: 3, faqs: 8,
    caption: 'Three completed categories and one ungraded final', example: '63.10',
    modeLink: '/grade-calculator#mode-points', mode: 'points'},
  {slug: 'calorie-calculator', title: 'Calorie Calculator: Daily Calories, BMR & TDEE', sections: 8, tables: 5, faqs: 9,
    caption: 'Activity scenarios for the same example, rounded to the nearest whole kcal', example: '2,556',
    modeLink: '/calorie-calculator#mode-energy-units', mode: 'energy-units'},
  {slug: 'age-calculator', title: 'Age Calculator: Years, Months, Days & Next Birthday', sections: 7, tables: 4, faqs: 9,
    caption: 'Different ways to describe the same example age', example: '10,127',
    modeLink: '/age-calculator#mode-age', mode: 'age'},
  {slug: 'gpa-calculator', title: 'College GPA Calculator: Semester & Cumulative GPA', sections: 7, tables: 3, faqs: 10,
    caption: 'Combine records through quality points and graded credits', example: '2.8974',
    modeLink: '/gpa-calculator#mode-semester-grades', mode: 'semester-grades'},
] as const;

const metric = (page: Page, label: string) => page.locator('.result-metrics .metric')
  .filter({has: page.getByText(label, {exact: true})}).locator('dd');

async function choose(page: Page, id: string, name: string) {
  await page.locator(`#${id}`).click();
  await page.getByRole('option', {name, exact: true}).click();
}

async function date(page: Page, label: string, value: string) {
  const [year, month, day] = value.split('-');
  for (const [segment, next] of [['year', year], ['month', month], ['day', day]]) {
    const input = page.getByRole('spinbutton', {name: `${segment}, ${label}`, exact: true});
    await input.focus();
    await input.pressSequentially(next);
  }
}

test.beforeEach(async ({page}) => {
  await page.route('https://pagead2.googlesyndication.com/**', route => route.abort());
});

test.describe('complete calculator guidance without JavaScript', () => {
  test.use({javaScriptEnabled: false});

  test('all four pages serve canonical metadata, worked tables, contents links and FAQ answers', async ({page}) => {
    for (const item of pages) {
      await page.goto(`/${item.slug}`, {waitUntil: 'domcontentloaded'});
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page).toHaveTitle(item.title);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://finflo.org/${item.slug}`);
      await expect(page.locator('section[id^="understanding-"]')).toHaveCount(item.sections);
      await expect(page.locator('section[id^="understanding-"] table')).toHaveCount(item.tables);
      const table = page.getByRole('table', {name: item.caption, exact: true});
      await expect(table).toBeVisible();
      await expect(table).toContainText(item.example);
      await expect(table.locator('th[scope="col"]').first()).toBeVisible();
      await expect(table.locator('th[scope="row"]').first()).toBeVisible();
      const contents = page.locator('[data-calculator-guide-nav] a');
      await expect(contents).toHaveCount(item.sections);
      for (let index = 0; index < item.sections; index++) {
        await expect(contents.nth(index)).toHaveAttribute('href', `#understanding-${index + 1}`);
        await expect(page.locator(`#understanding-${index + 1} h2`)).toHaveText(await contents.nth(index).innerText());
      }
      const questions = page.locator('#common-questions details');
      await expect(questions).toHaveCount(item.faqs);
      for (const answer of await questions.locator('p').allTextContents()) expect(answer.trim().length).toBeGreaterThan(50);
      await questions.first().locator('summary').click();
      await expect(questions.first().locator('p')).toBeVisible();
    }
  });
});

test('contents links jump to explanations and worked links open their calculator modes', async ({page}) => {
  for (const item of pages) {
    await page.goto(`/${item.slug}`);
    const jump = page.locator('[data-calculator-guide-nav] a').last();
    const target = await jump.getAttribute('href');
    await jump.click();
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    await expect(page.locator(`${target} h2`)).toBeInViewport();
    await page.locator(`section[id^="understanding-"] a[href="${item.modeLink}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`${item.modeLink}$`));
    await expect(page.locator('#calculator-inputs')).toHaveAttribute('data-mode', item.mode);
    await expect(page.locator('[data-calculator-submit]')).toBeEnabled();
  }
});

test('grade example keeps the completed average separate from the final-exam projection', async ({page}) => {
  await page.goto('/grade-calculator');
  const rows = page.getByRole('group', {name: 'Course categories', exact: true});
  await rows.getByRole('button', {name: 'Add row', exact: true}).click();
  const categories = [
    {name: 'Homework', weight: '20', score: '88'},
    {name: 'Midterm', weight: '30', score: '75'},
    {name: 'Project', weight: '25', score: '92'},
    {name: 'Final exam', weight: '25', score: ''},
  ];
  for (const [index, row] of categories.entries()) {
    for (const [key, value] of Object.entries({...row, plannedScore: ''})) {
      await page.locator(`#categories-categories-${index}-${key}`).fill(value);
    }
  }
  await page.locator('[data-calculator-submit]').click();
  await expect(page.locator('.primary-metric dd')).toHaveText('84.13%');
  await expect(metric(page, 'Graded course weight')).toHaveText('75%');
  await page.locator('#categories-categories-3-plannedScore').fill('80');
  await page.locator('[data-calculator-submit]').click();
  await expect(page.locator('.primary-metric dd')).toHaveText('84.13%');
  await expect(metric(page, 'Projected course grade')).toHaveText('83.1%');
});

test('GPA scale starts collapsed and preserves custom values across grade formats', async ({page}) => {
  await page.goto('/gpa-calculator');
  const scale = page.locator('.advanced-fields details').filter({has: page.locator('summary', {hasText: 'Grade scale'})});
  await expect(scale).not.toHaveAttribute('open');
  await expect(page.locator('#semester-grades-courses-0-grade')).toBeVisible();
  await scale.locator('summary').click();
  await page.locator('#semester-grades-maximum').fill('5');
  await page.locator('#semester-grades-gradeScale-3-points').fill('3.33');
  await choose(page, 'semester-grades-gradeFormat', 'Percentages');
  await page.locator('#semester-grades-percentScale-1-points').fill('3.2');
  await choose(page, 'semester-grades-gradeFormat', 'Letter grades');
  await expect(page.locator('#semester-grades-gradeScale-3-points')).toHaveValue('3.33');
  await expect(page.locator('#semester-grades-maximum')).toHaveValue('5');
  await page.locator('[data-calculator-submit]').click();
  await expect(page.locator('.primary-metric dd')).toHaveText('3.67');
  await choose(page, 'semester-grades-gradeFormat', 'Percentages');
  await expect(page.locator('#semester-grades-percentScale-1-points')).toHaveValue('3.2');
  await page.locator('#semester-grades-courses-0-grade').fill('95');
  await page.locator('#semester-grades-courses-1-grade').fill('85');
  await page.locator('[data-calculator-submit]').click();
  await expect(page.locator('.primary-metric dd')).toHaveText('3.6');
  const maximum = page.locator('#semester-grades-maximum');
  await maximum.fill('0');
  await scale.locator('summary').click();
  await expect(scale).not.toHaveAttribute('open');
  await page.locator('[data-calculator-submit]').click();
  await expect(scale).toHaveAttribute('open', '');
  await expect(maximum).toBeFocused();
  expect(await maximum.evaluate(input => !(input as HTMLInputElement).validity.valid)).toBe(true);
  await maximum.fill('5');
  await page.locator('[data-calculator-submit]').click();
  await expect(page.locator('.primary-metric dd')).toHaveText('3.6');
});

test('calorie unit changes preserve measurements and activity changes agree with the worked table', async ({page}) => {
  await page.goto('/calorie-calculator');
  await page.locator('[data-calculator-submit]').click();
  await expect(page.locator('.primary-metric dd')).toHaveText('1,978.5 kcal/day');
  await choose(page, 'energy-units', 'US (lb, inches)');
  expect(Number(await page.locator('#energy-weight').inputValue())).toBeCloseTo(154.3235835294, 8);
  expect(Number(await page.locator('#energy-height').inputValue())).toBeCloseTo(68.8976377953, 8);
  await page.locator('[data-calculator-submit]').click();
  await expect(page.locator('.primary-metric dd')).toHaveText('1,978.5 kcal/day');
  await choose(page, 'energy-activity', 'Moderate — 3–5 exercise days');
  await page.locator('[data-calculator-submit]').click();
  await expect(page.locator('.primary-metric dd')).toHaveText('2,555.56 kcal/day');
  await expect(metric(page, 'Estimated resting energy')).toHaveText('1,648.75 kcal/day');
  await expect(page.getByRole('table', {name: pages[1].caption, exact: true})).toContainText('2,556');
});

test('age example exposes complete months, weeks and the birthday countdown including birthday zero', async ({page}) => {
  await page.goto('/age-calculator');
  await date(page, 'Date of birth', '1998-09-23');
  await date(page, 'Age on', '2026-06-15');
  await page.locator('[data-calculator-submit]').click();
  await expect(page.locator('.primary-metric dd')).toHaveText('27 years, 8 months, 23 days');
  for (const [label, value] of [
    ['Total days', '10,127'], ['Completed calendar months', '332'], ['Complete weeks', '1,446'],
    ['Days after complete weeks', '5'], ['Next birthday', '2026-09-23'], ['Days until next birthday', '100'],
  ]) await expect(metric(page, label)).toHaveText(value);
  await date(page, 'Age on', '2026-09-23');
  await page.locator('[data-calculator-submit]').click();
  await expect(page.locator('.primary-metric dd')).toHaveText('28 years, 0 months, 0 days');
  await expect(metric(page, 'Days until next birthday')).toHaveText('0');
});

test('mobile guidance tables and compact student links stay readable and accessible', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  for (const item of pages) {
    await page.goto(`/${item.slug}`);
    await expect(page.getByRole('table', {name: item.caption, exact: true})).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), item.slug).toBe(true);
    const accessibility = await new AxeBuilder({page}).include('[data-calculator-guide-nav]').include('section[id^="understanding-"]').analyze();
    expect(accessibility.violations, item.slug).toEqual([]);
    if (item.slug === 'grade-calculator' || item.slug === 'gpa-calculator') {
      const navigation = page.getByRole('navigation', {name: 'Student calculators', exact: true});
      await expect(navigation.getByRole('link')).toHaveCount(4);
      await expect(navigation.locator('a[aria-current="page"]')).toHaveAttribute('href', `/${item.slug}`);
      await expect(page.locator('#student-calculators h3')).toHaveCount(0);
    }
  }
});
