import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

// Run against an already-running server. This script never starts or stops one.
// AUDIT_URL controls the HTTP target; AUDIT_CANONICAL_URL can override the public origin.
const base = new URL(process.env.AUDIT_URL || 'http://127.0.0.1:3100');
const canonicalBase = new URL(process.env.AUDIT_CANONICAL_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://finflo.org');
const root = resolve(import.meta.dirname, '..');
const json = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const manifest = await json('docs/validation/page-value-review.json');
const calculatorNotes = Object.assign({}, ...await Promise.all(['finance', 'health', 'math', 'everyday'].map(category => json(`src/data/insights/${category}.json`))));
const informationNotes = await json('src/data/insights/information.json');
const jobs = manifest.pages.flatMap(page => page.languages.map(locale => ({...page, locale, pathname: locale === 'en' ? page.path : `/${locale}${page.path === '/' ? '' : page.path}`})));
if (new Set(jobs.map(job => job.pathname)).size !== jobs.length) throw Error('The review manifest contains duplicate localized routes.');

const htmlEscape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
const decodeAttribute = value => value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[0-9a-f]+);/gi, entity => {
  const named = {'&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>'};
  if (entity.toLowerCase() in named) return named[entity.toLowerCase()];
  return String.fromCodePoint(Number.parseInt(entity.slice(entity[2].toLowerCase() === 'x' ? 3 : 2, -1), entity[2].toLowerCase() === 'x' ? 16 : 10));
});
const attributes = tag => Object.fromEntries([...tag.matchAll(/\s([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)].map(match => [match[1].toLowerCase(), decodeAttribute(match[2] ?? match[3] ?? match[4] ?? '')]));
const markerFor = page => {
  if (page.kind === 'calculator') return ['data-calculator-insight'];
  if (page.kind === 'regional-clock' || page.kind === 'time-tool' && page.path === '/time') return ['data-clock-comparison'];
  if (['directory', 'student-directory', 'guide-directory'].includes(page.kind)) return ['data-tool-chooser'];
  if (page.kind === 'guide') return ['data-guide-illustration'];
  if (page.kind === 'worked-guide') return ['id', 'guide-section-1'];
  if (page.kind === 'information') return ['data-information-insight'];
  if (page.kind === 'time-tool') return ['data-time-example'];
  if (['spin-wheel', 'wheel-directory'].includes(page.kind)) return ['id', 'starting-odds'];
  if (page.kind === 'homepage') return ['id', 'percentage-demo-title'];
  if (page.kind === 'sitemap') return ['data-sitemap-index'];
  if (page.kind === 'faq') return ['data-faq-page'];
  throw Error(`No rendered-content marker defined for ${page.kind}: ${page.path}`);
};
for (const job of jobs) markerFor(job);

let cursor = 0, completed = 0, passed = 0, receivedBytes = 0, noteChecks = 0;
const failures = [], byKind = {}, byLocale = {}, httpStatuses = {};
const started = Date.now();
function tally(group, key, ok) {
  group[key] ??= {checked: 0, passed: 0};
  group[key].checked++;
  if (ok) group[key].passed++;
}

async function inspect(job) {
  const url = new URL(job.pathname, base), issues = [];
  let status = null;
  try {
    const response = await fetch(url, {redirect: 'manual', signal: AbortSignal.timeout(45000), headers: {'user-agent': 'Finflo-Rendered-Content-Audit/1.0', accept: 'text/html'}});
    status = response.status;
    httpStatuses[status] = (httpStatuses[status] || 0) + 1;
    const html = await response.text();
    receivedBytes += Buffer.byteLength(html);
    if (status !== 200) issues.push(`HTTP ${status}${response.headers.get('location') ? ` → ${response.headers.get('location')}` : ''}`);
    if (!response.headers.get('content-type')?.includes('text/html')) issues.push('Response is not HTML.');

    // RSC/Next payloads may contain component names or serialized attributes.
    // Remove scripts before inspecting genuine opening HTML tags and visible text.
    const document = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
    const h1s = [...document.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi)];
    if (h1s.length !== 1 || !h1s[0][1].replace(/<[^>]*>/g, '').trim()) issues.push(`Expected one nonempty H1; found ${h1s.length}.`);
    const canonical = [...document.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0])).filter(attrs => attrs.rel?.toLowerCase().split(/\s+/).includes('canonical'));
    const expectedCanonical = new URL(job.pathname, canonicalBase).href;
    let actualCanonical;
    try {actualCanonical = canonical.length === 1 ? new URL(canonical[0].href).href : undefined;} catch { /* An invalid or relative canonical fails below. */ }
    if (actualCanonical !== expectedCanonical) issues.push(`Canonical mismatch: expected ${expectedCanonical}; received ${canonical.map(item => item.href).join(', ') || 'none'}.`);

    const [attribute, value] = markerFor(job);
    const openingTags = [...document.matchAll(/<[a-z][a-z0-9:-]*\b[^>]*>/gi)];
    const marker = openingTags.find(match => {
      const attrs = attributes(match[0]);
      return Object.hasOwn(attrs, attribute) && (value === undefined || attrs[attribute] === value);
    });
    if (!marker) issues.push(`Missing rendered opening tag with ${attribute}${value === undefined ? '' : `="${value}"`}.`);

    if (job.kind === 'calculator' || job.kind === 'information') {
      const record = (job.kind === 'calculator' ? calculatorNotes : informationNotes)[job.path.slice(1)]?.[job.locale];
      if (!record) issues.push(`Missing source note for ${job.locale}.`);
      else if (marker) {
        const sectionStart = marker.index + marker[0].length;
        const sectionEnd = document.indexOf('</section>', sectionStart);
        const section = document.slice(sectionStart, sectionEnd < 0 ? undefined : sectionEnd);
        if (!section.includes(`<h2>${htmlEscape(record.heading)}</h2>`)) issues.push('Localized note heading does not match rendered section.');
        if (!section.includes(`<p>${htmlEscape(record.body)}</p>`)) issues.push('Localized note body does not match rendered section.');
        noteChecks++;
      }
    }
  } catch (error) {
    issues.push(`${error.name || 'Error'}: ${error.message}`);
  }
  const ok = issues.length === 0;
  tally(byKind, job.kind, ok);
  tally(byLocale, job.locale, ok);
  if (ok) passed++;
  else failures.push({path: job.pathname, kind: job.kind, status, issues});
  completed++;
  if (completed % 500 === 0 || completed === jobs.length) console.log(JSON.stringify({progress: `${completed}/${jobs.length}`, passed, failed: failures.length, elapsedSeconds: Math.round((Date.now() - started) / 1000)}));
}

async function worker() {
  while (cursor < jobs.length) {
    const job = jobs[cursor++];
    await inspect(job);
  }
}
console.log(JSON.stringify({audit: 'rendered-page-value', target: base.origin, sourceRoutes: manifest.pages.length, localizedURLs: jobs.length, concurrency: 2}));
await Promise.all([worker(), worker()]);
const report = {
  checkedAt: new Date().toISOString(), baseURL: base.href, canonicalBaseURL: canonicalBase.href,
  sourceRoutes: manifest.pages.length, localizedURLs: jobs.length, concurrency: 2,
  checked: completed, passed, failed: failures.length, localizedNoteChecks: noteChecks,
  elapsedSeconds: Math.round((Date.now() - started) / 1000), receivedBytes, httpStatuses, byKind, byLocale,
  checks: ['HTTP 200 and HTML content type', 'Exactly one nonempty rendered H1', 'Exact localized canonical URL after standard URL normalization', 'Actual opening HTML tag for the page-family addition, excluding scripts and comments', 'Exact escaped localized heading and body inside calculator and information note sections'],
  scope: 'HTTP response HTML for every manifest route and language. This verifies rendered content, not client interaction, visual layout, or the substantive correctness of every calculation.',
  failures,
};
await mkdir(resolve(root, 'docs/validation'), {recursive: true});
await writeFile(resolve(root, 'docs/validation/page-value-rendered.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({checked: completed, passed, failed: failures.length, localizedNoteChecks: noteChecks, elapsedSeconds: report.elapsedSeconds, report: 'docs/validation/page-value-rendered.json'}));
if (failures.length) process.exitCode = 1;
