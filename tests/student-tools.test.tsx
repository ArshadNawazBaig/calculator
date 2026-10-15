import {afterEach, describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import sitemap from '@/app/sitemap';
import {StudentTools} from '@/components/content/student-tools';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap, relatedTools, toolMap} from '@/lib/calculators/registry';
import {defaults, type Values} from '@/lib/calculators/types';
import {searchCalculators} from '@/lib/calculator-search';
import {studentDirectory, studentTools, studentToolHref} from '@/lib/student-tools';
import {site} from '@/lib/site';
import {pageMetadata} from '@/lib/metadata';
import {getCalculatorSeoTitle} from '@/lib/toolkit-editorial';
import {getContentDictionary} from '@/lib/i18n/content';
import {locales} from '@/lib/i18n/config';

async function run(slug: string, modeId: string, values: Values = {}) {
  const mode = definitionMap.get(slug)!.modes.find(mode => mode.id === modeId)!;
  return calculate('everyday', mode, {...defaults(mode), ...values});
}
const categoryResult = (rows: Record<string, unknown>[]) => run('grade-calculator', 'categories', {categories: JSON.stringify(rows)});
const indexing = site.indexable;
afterEach(() => {site.indexable = indexing;});

describe('student calculator discovery', () => {
  it('gives each task its own canonical page, unique metadata, and links to the other student tools', () => {
    const html = renderToStaticMarkup(<StudentTools/>);
    for (const tool of studentTools) {
      expect(definitionMap.get(tool.slug)!.modes.some(mode => mode.id === tool.mode)).toBe(true);
      expect(html).toContain(`href="${studentToolHref(tool)}"`);
    }
    site.indexable = true;
    const urls = sitemap().map(entry => entry.url);
    for (const locale of locales) expect(urls).toContain(`${site.url}${locale === 'en' ? '' : '/' + locale}${studentDirectory.path}`);
    for (const {slug, title, seoTitle, description} of studentTools) {
      expect(urls.filter(url => url === `${site.url}/${slug}`)).toHaveLength(1);
      expect(toolMap.get(slug)?.title).toBe(title);
      expect(definitionMap.get(slug)?.description).toBe(description);
      expect(getCalculatorSeoTitle(slug)).toBe(seoTitle);
      const metadata = pageMetadata(seoTitle, description, `/${slug}`);
      expect(metadata.title).toEqual({absolute: seoTitle});
      expect(metadata.description).toBe(description);
      expect(metadata.alternates?.canonical).toBe(`/${slug}`);
      for (const other of studentTools.filter(tool => tool.slug !== slug)) {
        expect(relatedTools(toolMap.get(slug)!).map(tool => tool.slug)).toContain(other.slug);
      }
    }
    expect(new Set(studentTools.map(tool => tool.slug)).size).toBe(4);
    expect(new Set(studentTools.map(tool => tool.seoTitle)).size).toBe(4);
    expect(new Set(studentTools.map(tool => tool.description)).size).toBe(4);
    expect(urls.some(url => /#mode-/.test(url))).toBe(false);
    expect(renderToStaticMarkup(<StudentTools compact/>)).toContain('href="/calculators#student-calculators"');
    expect(relatedTools(toolMap.get('grade-calculator')!).map(tool => tool.slug)).toContain('gpa-calculator');
    expect(relatedTools(toolMap.get('gpa-calculator')!).map(tool => tool.slug)).toContain('grade-calculator');
  });
  it('moves final-score and GPA-target modes instead of publishing duplicate workflows', () => {
    for (const mode of ['final', 'letter-final']) expect(definitionMap.get('grade-calculator')!.modes.map(mode => mode.id)).not.toContain(mode);
    expect(definitionMap.get('gpa-calculator')!.modes.map(mode => mode.id)).not.toContain('target');
    expect(definitionMap.get('final-exam-grade-calculator')!.modes.map(mode => mode.id)).toEqual(['final', 'letter-final']);
    expect(definitionMap.get('gpa-goal-calculator')!.modes.map(mode => mode.id)).toEqual(['target']);
    for (const tool of studentTools) expect(definitionMap.get(tool.slug)!.modes[0].id).toBe(tool.mode);
  });
  it('translates the new page titles, descriptions, and cluster links in every language', async () => {
    for (const locale of locales.filter(locale => locale !== 'en')) {
      const messages = await getContentDictionary(locale);
      const html = renderToStaticMarkup(<StudentTools locale={locale} messages={messages}/>);
      for (const tool of studentTools) {
        expect(messages[tool.seoTitle]).toBeTruthy();
        expect(messages[tool.description]).toBeTruthy();
        expect(messages[`tool.${tool.slug}`]).toBeTruthy();
        expect(html).toContain(`href="/${locale}/${tool.slug}"`);
        expect(html).not.toContain(tool.description);
      }
    }
  });
  it.each([
    ['final exam grade calculator', 'final-exam-grade-calculator'],
    ['weighted grade', 'grade-calculator'],
    ['ungraded assignments', 'grade-calculator'],
    ['college GPA calculator', 'gpa-calculator'],
    ['GPA goal calculator', 'gpa-goal-calculator'],
  ])('finds %s without a duplicate catalog entry', (query, slug) => {
    expect(searchCalculators(query)[0]?.slug).toBe(slug);
  });
});

describe('weighted categories and final exams', () => {
  it('separates completed work from a full what-if projection', async () => {
    const result = await run('grade-calculator', 'categories');
    const metrics = Object.fromEntries(result.metrics.map(metric => [metric.label, metric.value]));
    expect(metrics['Current weighted grade']).toBeCloseTo(84.2857142857);
    expect(metrics['Projected course grade']).toBe(86);
    expect(metrics['Graded course weight']).toBe(70);
    expect(metrics['Projected course weight']).toBe(100);
    expect(result.table?.rows[2]).toEqual(['Final exam', 30, 'Ungraded', 90]);
  });
  it('counts an actual zero but excludes a blank, and allows what-if overrides', async () => {
    const result = await categoryResult([{weight: 50, score: 80, plannedScore: 90}, {weight: 50, score: 0, plannedScore: ''}]);
    expect(result.metrics[0].value).toBe(40);
    expect(result.metrics[1].value).toBe(45);
    const blank = await categoryResult([{weight: 50, score: 80}, {weight: 50, score: ' '}]);
    expect(blank.metrics[0].value).toBe(80);
    expect(blank.metrics.some(metric => metric.label === 'Projected course grade')).toBe(false);
    expect(blank.notes?.join(' ')).toContain('less than 100%');
  });
  it('supports entirely future work without inventing a current grade', async () => {
    const result = await categoryResult([{weight: 100, score: '', plannedScore: 85}]);
    expect(result.metrics[0].value).toBe('No graded work yet');
    expect(result.metrics[1].value).toBe(85);
    const unplanned = await categoryResult([{weight: 100, score: ''}]);
    expect(unplanned.metrics.some(metric => metric.label.startsWith('Projected') && metric.label !== 'Projected course weight')).toBe(false);
  });
  it('labels partial course coverage and handles decimal weights exactly', async () => {
    const partial = await categoryResult([{weight: 30, score: 90}, {weight: 40, score: 80}]);
    expect(partial.metrics.find(metric => metric.label === 'Unassigned course weight')?.value).toBe(30);
    expect(partial.metrics[1].label).toBe('Projected average of entered scores');
    const complete = await categoryResult([{weight: 33.3, score: 90}, {weight: 33.3, score: 90}, {weight: 33.4, score: 90}]);
    expect(complete.metrics[1]).toMatchObject({label: 'Projected course grade', value: 90});
  });
  it.each([
    [], [{weight: 70, score: 80}, {weight: 40, score: 90}],
    [{weight: -1, score: 80}], [{weight: 0, score: 80}], [{weight: 100, score: 101}],
    [{weight: 100, score: 80, plannedScore: -1}], [{weight: '', score: 80}],
  ])('rejects invalid categories %#', async (...rows) => {
    await expect(categoryResult(rows as Record<string, unknown>[])).rejects.toThrow();
  });
  it('calculates the required final score and validates exam weight', async () => {
    const result = await run('final-exam-grade-calculator', 'final', {current: '85', target: '88', weight: '30'});
    expect(result.metrics[0].value).toBe(95);
    expect((await run('final-exam-grade-calculator', 'final', {current: '0', target: '88', weight: '100'})).metrics[0].value).toBe(88);
    await expect(run('final-exam-grade-calculator', 'final', {weight: '0'})).rejects.toThrow();
  });
});

describe('college GPA and future goals', () => {
  it('opens with course rows and credits, combining a prior record without averaging GPAs', async () => {
    expect(definitionMap.get('gpa-calculator')!.modes[0].id).toBe('semester-grades');
    const result = await run('gpa-calculator', 'semester-grades', {previousGpa: '3', previousCredits: '30', courses: JSON.stringify([
      {courseName: 'Math', semester: 'Fall', grade: 'A', credits: 3},
      {courseName: 'English', semester: 'Fall', grade: 'B', credits: 4},
      {courseName: 'Activity', semester: 'Fall', grade: 'P', credits: 2},
    ])});
    expect(result.metrics[0].value).toBeCloseTo(114 / 37);
    expect(result.table?.rows[0]).toEqual(['Fall', 7, 24, 24 / 7]);
  });
  it('shows an impossible goal and independently calculated scenario projections', async () => {
    const result = await run('gpa-goal-calculator', 'target');
    expect(result.metrics[0]).toMatchObject({value: 4.1, displayValue: 'Target not attainable'});
    expect(result.metrics[1].value).toBeCloseTo(312 / 90);
    expect(result.table?.rows.map(row => row[2])).toEqual([282 / 90, 297 / 90, 312 / 90]);
    expect(result.table?.rows.every(row => row[3] === 'No')).toBe(true);
    const attainable = await run('gpa-goal-calculator', 'target', {future: '60'});
    expect(attainable.metrics[0]).toMatchObject({value: 3.8, displayValue: undefined});
    expect(attainable.table?.rows[2][3]).toBe('Yes');
  });
  it('handles zero completed credits, secured goals, and a custom maximum', async () => {
    expect((await run('gpa-goal-calculator', 'target', {credits: '0'})).metrics[0].value).toBe(3.5);
    expect((await run('gpa-goal-calculator', 'target', {target: '2'})).metrics[0].displayValue).toBe('Target already secured');
    expect((await run('gpa-goal-calculator', 'target', {maximum: '5'})).metrics[0].displayValue).toBeUndefined();
    const empty = await run('gpa-goal-calculator', 'target', {scenarios: '[]'});
    expect(empty.table).toBeUndefined();
  });
  it.each<Values>([{future: '0'}, {credits: '-1'}, {current: '4.1'}, {target: '4.1'}, {maximum: '0'}, {scenarios: '[{"gpa":4.1}]'}, {scenarios: '[{"gpa":""}]'}])('rejects invalid GPA plans %j', async values => {
    await expect(run('gpa-goal-calculator', 'target', values)).rejects.toThrow();
  });
});
