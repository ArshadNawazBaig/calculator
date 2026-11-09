import {chromium} from 'playwright';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';

// Run against a production server after audit:content. This is a UI smoke test,
// not an independent numerical review of every mode or an AdSense assessment.
const base = process.env.TEST_URL || 'http://localhost:3100';
const output = process.env.BROWSER_AUDIT_OUTPUT || 'test-results/calculator-browser-audit.json';
const inventory = JSON.parse(await readFile('docs/validation/content-inventory.json', 'utf8'));
const jobs = inventory.pages.filter(page => page.kind === 'calculator');
const browser = await chromium.launch();
const results = [];
let cursor = 0;
async function worker() {
  const context = await browser.newContext({viewport: {width: 360, height: 844}});
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  try {
    while (cursor < jobs.length) {
      const job = jobs[cursor++], errors = [], issues = [];
      const onError = error => errors.push(error.message);
      page.on('pageerror', onError);
      let status = null, primaryResult = null, formError = null;
      try {
        const response = await page.goto(new URL(job.path, base).href, {waitUntil: 'domcontentloaded', timeout: 30000});
        status = response?.status();
        if (status !== 200) issues.push(`HTTP ${status}`);
        if (await page.locator('h1').count() !== 1) issues.push('Expected exactly one H1');
        if (job.path === '/mileage-calculator') {
          await page.locator('#driving-locationInput').click();
          await page.getByRole('option', {name: 'Latitude and longitude', exact: true}).click();
        }
        await page.locator('[data-calculator-submit]').click();
        await page.waitForFunction(() => document.querySelector('#calculation-summary .result-heading .eyebrow')?.textContent === 'YOUR RESULT' || document.querySelector('.calculator-form .form-error'), null, {timeout: 20000});
        formError = (await page.locator('.calculator-form .form-error').allTextContents()).join(' ') || null;
        if (formError) issues.push(`Calculation error: ${formError}`);
        primaryResult = (await page.locator('#calculation-summary .primary-metric dd').allTextContents()).join(' ') || null;
        if (!primaryResult?.trim()) issues.push('Missing result');
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) issues.push('Page overflows the 360px viewport');
        if (job.references > 0 && await page.locator('#sources a').count() === 0) issues.push('Missing configured formula references');
      } catch (error) { issues.push(error.message); }
      finally { page.off('pageerror', onError); }
      issues.push(...errors.map(error => `Browser error: ${error}`));
      results.push({path: job.path, mode: job.modes[0], status, primaryResult, formError, passed: issues.length === 0, issues});
      if (results.length % 25 === 0 || results.length === jobs.length) console.log(JSON.stringify({checked: results.length, total: jobs.length, failed: results.filter(row => !row.passed).length}));
    }
  } finally { await context.close(); }
}
try { await Promise.all([worker(), worker()]); }
finally { await browser.close(); }
results.sort((a, b) => a.path.localeCompare(b.path));
const report = {checkedAt: new Date().toISOString(), base, viewport: {width: 360, height: 844}, concurrency: 2,
  scope: 'One default-mode calculation submitted through Chromium on every source calculator page. Mileage uses the supplied coordinate defaults and the actual route service. Checks HTTP, result rendering, formula references, browser errors, and page overflow. Does not independently establish numerical correctness, all-mode UI coverage, specialist review, or Google approval.',
  checked: results.length, passed: results.filter(row => row.passed).length, failed: results.filter(row => !row.passed).length, results};
await mkdir(dirname(output), {recursive: true});
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({output, checked: report.checked, passed: report.passed, failed: report.failed}));
if (report.failed) process.exitCode = 1;
