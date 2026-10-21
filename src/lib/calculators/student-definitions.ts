import {studentTools} from '@/lib/student-tools';
import {mode, n, type Definition, type Mode} from './types';

export const categoryGradesMode = mode('categories', 'Category weights & what-if grades', 'grade-categories', [{
  key: 'categories', label: 'Course categories', type: 'rows',
  hint: 'Enter each category once using its course weight. Leave an ungraded score blank; enter 0 only for an actual zero. Optional what-if scores replace the current score in the projection.',
  default: JSON.stringify([{name: 'Homework', weight: 30, score: 90, plannedScore: ''}, {name: 'Midterm', weight: 40, score: 80, plannedScore: ''}, {name: 'Final exam', weight: 30, score: '', plannedScore: 90}]),
  rowColumns: [
    {key: 'name', label: 'Category', default: 'Category'},
    {key: 'weight', label: 'Course weight (%)', type: 'number', default: '10'},
    {key: 'score', label: 'Current score (%)', type: 'number', default: ''},
    {key: 'plannedScore', label: 'What-if score (%)', type: 'number', default: ''},
  ],
}], 'Current average = Σ(graded score × category weight) / Σgraded weights. Projected average uses what-if scores where supplied.', 'Blank scores are ungraded and excluded from the current average. A zero is a graded score. Use category averages from your gradebook; this mode does not calculate within-category assignment weights. A full course projection needs scores for 100% of the course.');

export const gpaTargetMode: Mode = mode('target', 'Target GPA planner', 'gpa-target', [
  n('current', 'Current GPA', 3.2, undefined, 0, 100),
  n('credits', 'Completed credits', 60, undefined, 0),
  n('target', 'Target cumulative GPA', 3.5, undefined, 0, 100),
  n('future', 'Future credits', 30, undefined, 0.01),
  n('maximum', 'Maximum grade points', 4, undefined, 0.1, 100),
  {key: 'scenarios', label: 'Future GPA scenarios', type: 'rows',
    hint: 'Each row is a separate alternative for the same future credits. Use the credit-weighted average across your upcoming semesters.',
    default: JSON.stringify([{name: 'Steady', gpa: 3}, {name: 'Improved', gpa: 3.5}, {name: 'Stretch', gpa: 4}]),
    rowColumns: [{key: 'name', label: 'Scenario', default: 'Scenario'}, {key: 'gpa', label: 'Future GPA', type: 'number', default: '3'}]},
], 'Required future GPA = [target × (completed + future credits) − current × completed credits] / future credits.', 'Compare the required GPA with your institution’s maximum. Each scenario combines your existing quality points with future GPA × future credits. Future credits must be positive, and all GPAs must use the same scale.');

/** Move the existing workflows, keeping a single owner for each calculation. */
export function separateStudentCalculators(definitions: Definition[]) {
  const grade = definitions.find(definition => definition.slug === 'grade-calculator')!;
  const gpa = definitions.find(definition => definition.slug === 'gpa-calculator')!;
  const finalModes = grade.modes.filter(mode => ['final', 'letter-final'].includes(mode.id));
  grade.modes = [categoryGradesMode, ...grade.modes.filter(mode => !finalModes.includes(mode))];
  const target = gpa.modes.find(mode => mode.id === 'target')!;
  const semester = gpa.modes.find(mode => mode.id === 'semester-grades')!;
  gpa.modes = [semester, ...gpa.modes.filter(mode => mode !== target && mode !== semester)];
  definitions.push(
    {slug: 'final-exam-grade-calculator', description: '', modes: finalModes, sources: structuredClone(grade.sources)},
    {slug: 'gpa-goal-calculator', description: '', modes: [target], sources: structuredClone(gpa.sources)},
  );
  for (const tool of studentTools) definitions.find(definition => definition.slug === tool.slug)!.description = tool.description;
}
