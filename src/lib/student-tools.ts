export const studentDirectory = {
  path: '/calculators/students',
  title: 'Student calculators',
  description: 'Find calculators for weighted grades, final exam scores, semester and cumulative GPA, and future GPA goals.',
};

/** Each student task has one canonical page and its own search metadata. */
export const studentTools = [
  {slug: 'grade-calculator', mode: 'categories', title: 'Weighted Grade Calculator', seoTitle: 'Weighted Grade Calculator: Categories & Points', description: 'Calculate weighted or points-based grades, exclude ungraded work, and compare what-if scores.'},
  {slug: 'final-exam-grade-calculator', mode: 'final', title: 'Final Exam Grade Calculator', seoTitle: 'Final Exam Grade Calculator: Required Score', description: 'Calculate the final exam score you need from your current grade, target grade, and final exam weight.'},
  {slug: 'gpa-calculator', mode: 'semester-grades', title: 'College GPA Calculator', seoTitle: 'College GPA Calculator: Semester & Cumulative GPA', description: 'Calculate semester and cumulative GPA using course grades, credit hours, and your institution’s grading scale.'},
  {slug: 'gpa-goal-calculator', mode: 'target', title: 'GPA Goal Calculator', seoTitle: 'GPA Goal Calculator: Required Future GPA', description: 'Calculate the future GPA needed to reach your cumulative GPA goal and compare scenarios for your remaining credits.'},
] as const;

export const calculatorModeHash = (mode: string) => `#mode-${mode}`;
export const studentToolHref = (tool: typeof studentTools[number]) => `/${tool.slug}`;
export const isStudentCalculator = (slug: string) => studentTools.some(tool => tool.slug === slug);

/** Preserve old mode links and saved calculations when a workflow moves. */
export function movedStudentMode(slug: string, mode: string): string | undefined {
  if (slug === 'grade-calculator' && ['final', 'letter-final'].includes(mode)) return 'final-exam-grade-calculator';
  if (slug === 'gpa-calculator' && mode === 'target') return 'gpa-goal-calculator';
}
