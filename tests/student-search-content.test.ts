import {describe, expect, it} from 'vitest';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults, type Result, type Values} from '@/lib/calculators/types';

async function run(slug: string, id: string, values: Values) {
  const mode = definitionMap.get(slug)!.modes.find(item => item.id === id)!;
  return calculate('everyday', mode, {...defaults(mode), ...values});
}
const metric = (result: Result, label: string) => result.metrics.find(item => item.label === label)!.value;
const categories = [
  {name: 'Homework', weight: 20, score: 88, plannedScore: ''},
  {name: 'Midterm', weight: 30, score: 75, plannedScore: ''},
  {name: 'Project', weight: 25, score: 92, plannedScore: ''},
  {name: 'Final exam', weight: 25, score: '', plannedScore: ''},
];
const courses = [
  {courseName: 'Economics', semester: 'New semester', grade: 'A', credits: 4, includeInGpa: 'yes'},
  {courseName: 'Composition', semester: 'New semester', grade: 'B', credits: 3, includeInGpa: 'yes'},
  {courseName: 'Laboratory', semester: 'New semester', grade: 'C', credits: 2, includeInGpa: 'yes'},
];

describe('grade page worked scenarios', () => {
  it('distinguishes earned course points, current average and the full projection', async () => {
    const current = await run('grade-calculator', 'categories', {categories: JSON.stringify(categories)});
    expect(metric(current, 'Current weighted grade')).toBeCloseTo(63.1 / .75, 8);
    expect(metric(current, 'Graded course weight')).toBe(75);
    expect(current.metrics.some(item => item.label === 'Projected course grade')).toBe(false);
    const planned = await run('grade-calculator', 'categories', {
      categories: JSON.stringify(categories.map((row, i) => i === 3 ? {...row, plannedScore: 80} : row)),
    });
    expect(metric(planned, 'Current weighted grade')).toBeCloseTo(84.1333333333, 8);
    expect(metric(planned, 'Projected course grade')).toBeCloseTo(83.1, 8);
  });

  it('counts an actual zero on the final and independently verifies the maximum', async () => {
    const zero = await run('grade-calculator', 'categories', {
      categories: JSON.stringify(categories.map((row, i) => i === 3 ? {...row, score: 0} : row)),
    });
    expect(metric(zero, 'Current weighted grade')).toBeCloseTo(63.1, 8);
    expect(metric(zero, 'Graded course weight')).toBe(100);
    const perfect = await run('grade-calculator', 'categories', {
      categories: JSON.stringify(categories.map((row, i) => i === 3 ? {...row, plannedScore: 100} : row)),
    });
    expect(metric(perfect, 'Projected course grade')).toBeCloseTo(88.1, 8);
  });

  it('weights points by the possible totals before using the category result', async () => {
    const points = await run('grade-calculator', 'points', {scores: '18,20\n42,60'});
    expect(metric(points, 'Earned points')).toBe(60);
    expect(metric(points, 'Possible points')).toBe(80);
    expect(metric(points, 'Grade')).toBe(75);
    expect(metric(points, 'Grade')).not.toBe((90 + 70) / 2);
    const category = await run('grade-calculator', 'categories', {
      categories: JSON.stringify([{name: 'Laboratory', weight: 25, score: 75}]),
    });
    expect(metric(category, 'Current weighted grade')).toBe(75);
    expect(Number(metric(category, 'Current weighted grade')) * Number(metric(category, 'Graded course weight')) / 100).toBe(18.75);
  });

  it('applies the declared representative letter percentages without inventing an output letter', async () => {
    const output = await run('grade-calculator', 'letter-assessments', {
      assessments: JSON.stringify([{name: 'Assignment', grade: 'A', weight: 40}, {name: 'Exam', grade: 'B', weight: 60}]),
      weightBasis: 'percentage',
    });
    expect(metric(output, 'Weighted average')).toBe(89);
    expect(output.table?.rows.map(row => row[1])).toEqual([95, 85]);
    expect(output.notes?.join(' ')).toContain('no final letter is inferred');
  });

  it('reproduces the final-exam target through the dedicated linked calculator', async () => {
    const output = await run('final-exam-grade-calculator', 'final', {current: String(63.1 / .75), target: '85', weight: '25'});
    expect(Number(output.metrics[0].value)).toBeCloseTo(87.6, 8);
    expect(63.1 + Number(output.metrics[0].value) * .25).toBeCloseTo(85, 8);
  });
});

describe('GPA page worked scenarios', () => {
  it('weights course grades by credits rather than averaging the three grade values', async () => {
    const output = await run('gpa-calculator', 'semester-grades', {courses: JSON.stringify(courses)});
    expect(metric(output, 'New quality points')).toBe(29);
    expect(metric(output, 'New graded credits')).toBe(9);
    expect(Number(metric(output, 'Cumulative GPA'))).toBeCloseTo(29 / 9, 10);
    expect(output.table?.rows).toEqual([['New semester', 9, 29, 29 / 9]]);
  });

  it('combines the unequal previous and new records using quality points', async () => {
    const output = await run('gpa-calculator', 'semester-grades', {
      courses: JSON.stringify(courses), previousGpa: '2.8', previousCredits: '30',
    });
    expect(metric(output, 'Total graded credits')).toBe(39);
    expect(Number(metric(output, 'Cumulative GPA'))).toBeCloseTo(113 / 39, 10);
    expect(Number(metric(output, 'Cumulative GPA'))).not.toBeCloseTo((2.8 + 29 / 9) / 2, 2);
  });

  it('distinguishes the example excluded P from an included F carrying the same credits', async () => {
    const extra = {courseName: 'Additional course', semester: 'New semester', credits: 3, includeInGpa: 'yes'};
    const pass = await run('gpa-calculator', 'semester-grades', {courses: JSON.stringify([...courses, {...extra, grade: 'P'}])});
    const fail = await run('gpa-calculator', 'semester-grades', {courses: JSON.stringify([...courses, {...extra, grade: 'F'}])});
    expect(metric(pass, 'New graded credits')).toBe(9);
    expect(Number(metric(pass, 'Cumulative GPA'))).toBeCloseTo(29 / 9, 10);
    expect(metric(fail, 'New graded credits')).toBe(12);
    expect(Number(metric(fail, 'Cumulative GPA'))).toBeCloseTo(29 / 12, 10);
  });

  it('uses the selected percentage thresholds instead of a linear percentage conversion', async () => {
    const output = await run('gpa-calculator', 'semester-grades', {
      gradeFormat: 'percentage', courses: JSON.stringify([{grade: '85', credits: 3, includeInGpa: 'yes'}]),
    });
    expect(metric(output, 'Cumulative GPA')).toBe(3);
    expect(metric(output, 'Cumulative GPA')).not.toBe(85 / 25);
  });

  it('accepts course-specific weighted points without adding a second honors bonus', async () => {
    const output = await run('gpa-calculator', 'semester-grades', {
      gradeFormat: 'points', maximum: '5', courses: JSON.stringify([
        {courseName: 'Advanced course', grade: '5', credits: 3, includeInGpa: 'yes'},
        {courseName: 'Regular course', grade: '4', credits: 4, includeInGpa: 'yes'},
      ]),
    });
    expect(metric(output, 'New quality points')).toBe(31);
    expect(Number(metric(output, 'Cumulative GPA'))).toBeCloseTo(31 / 7, 10);
  });

  it('keeps a 10-point CGPA on the supplied scale rather than converting it to 4.0', async () => {
    const output = await run('gpa-calculator', 'semester-grades', {
      gradeFormat: 'points', maximum: '10', courses: JSON.stringify([
        {grade: '9', credits: 4, includeInGpa: 'yes'},
        {grade: '8', credits: 3, includeInGpa: 'yes'},
        {grade: '7', credits: 2, includeInGpa: 'yes'},
      ]),
    });
    expect(metric(output, 'New quality points')).toBe(74);
    expect(Number(metric(output, 'Cumulative GPA'))).toBeCloseTo(74 / 9, 10);
  });

  it('reproduces the future-credit target through the dedicated GPA planner', async () => {
    const output = await run('gpa-goal-calculator', 'target', {current: '2.8', credits: '30', target: '3', future: '15', maximum: '4'});
    expect(metric(output, 'Required future GPA')).toBe(3.4);
    expect(metric(output, 'Highest possible cumulative GPA')).toBe(3.2);
    expect((2.8 * 30 + 3.4 * 15) / 45).toBe(3);
  });
});
