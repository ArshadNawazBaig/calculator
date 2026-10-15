import Decimal from 'decimal.js';
import {parseRows, rowNumber} from './row-data';
import {metric as m, type Result, type Values} from './types';

export function categoryGrades(values: Values): Result {
  const rows = parseRows(values.categories, 'Course categories');
  if (!rows.length) throw Error('Add at least one course category.');
  let totalWeight = new Decimal(0), gradedWeight = new Decimal(0), earned = new Decimal(0), projectedWeight = new Decimal(0), projected = new Decimal(0);
  const optionalScore = (raw: unknown) => raw === undefined || String(raw).trim() === '' ? null : rowNumber(raw, 'Score', 0, 100);
  const table = rows.map(row => {
    const weight = rowNumber(row.weight, 'Category weight', 0, 100);
    if (weight === 0) throw Error('Each category needs a positive course weight.');
    const score = optionalScore(row.score), planned = optionalScore(row.plannedScore) ?? score;
    totalWeight = totalWeight.plus(weight);
    if (score !== null) { gradedWeight = gradedWeight.plus(weight); earned = earned.plus(new Decimal(score).times(weight)); }
    if (planned !== null) { projectedWeight = projectedWeight.plus(weight); projected = projected.plus(new Decimal(planned).times(weight)); }
    return [String(row.name || 'Category'), weight, score ?? 'Ungraded', planned ?? 'Not planned'];
  });
  if (totalWeight.gt(100)) throw Error('Category weights cannot total more than 100%.');
  return {
    metrics: [
      gradedWeight.gt(0) ? m('Current weighted grade', earned.div(gradedWeight).toNumber(), 'percent') : {...m('Current weighted grade', 'No graded work yet'), translateValue: true},
      ...(projectedWeight.gt(0) ? [m(projectedWeight.eq(100) ? 'Projected course grade' : 'Projected average of entered scores', projected.div(projectedWeight).toNumber(), 'percent')] : []),
      m('Graded course weight', gradedWeight.toNumber(), 'percent'),
      m('Projected course weight', projectedWeight.toNumber(), 'percent'),
      m('Unassigned course weight', new Decimal(100).minus(totalWeight).toNumber(), 'percent'),
    ],
    table: {headers: ['Category', 'Course weight (%)', 'Current score (%)', 'Projected score (%)'], rows: table, translateColumns: [2, 3]},
    notes: ['Blank current scores are excluded, while a score of zero counts toward the current grade. What-if scores affect only the projection.',
      ...(projectedWeight.lt(100) ? ['The projection covers less than 100% of the course. Add the missing categories and scores before treating it as a final course grade.'] : [])],
  };
}

export function gpaTarget(values: Values): Result {
  const maximum = rowNumber(values.maximum ?? '4', 'Maximum grade points', 0.1, 100);
  const current = new Decimal(rowNumber(values.current, 'Current GPA', 0, maximum));
  const target = new Decimal(rowNumber(values.target, 'Target cumulative GPA', 0, maximum));
  const credits = new Decimal(rowNumber(values.credits, 'Completed credits', 0));
  const future = new Decimal(rowNumber(values.future, 'Future credits', 0));
  if (future.isZero()) throw Error('Future credits must be greater than zero.');
  const total = credits.plus(future), quality = current.times(credits);
  const required = target.times(total).minus(quality).div(future);
  const impossible = required.gt(maximum), secured = required.lte(0);
  const scenarios = parseRows(values.scenarios ?? '[]', 'Future GPA scenarios');
  return {
    metrics: [
      {...m('Required future GPA', required.toNumber()), displayValue: impossible ? 'Target not attainable' : secured ? 'Target already secured' : undefined},
      m('Highest possible cumulative GPA', quality.plus(future.times(maximum)).div(total).toNumber()),
      m('Total graded credits', total.toNumber()),
      ...(secured ? [m('Minimum future GPA', 0)] : []),
    ],
    ...(scenarios.length ? {table: {headers: ['Scenario', 'Future GPA', 'Projected cumulative GPA', 'Target reached'], rows: scenarios.map(row => {
      const gpa = rowNumber(row.gpa, 'Scenario GPA', 0, maximum), projected = quality.plus(future.times(gpa)).div(total);
      return [String(row.name || 'Scenario'), gpa, projected.toNumber(), projected.gte(target) ? 'Yes' : 'No'];
    }), translateColumns: [3]}} : {}),
    notes: [impossible ? 'The required future GPA exceeds the selected maximum. Try more future credits or a lower target.' : secured ? 'The target is met even with a future GPA of zero under this credit plan.' : 'The target is reachable within the selected grade-point scale.',
      'Scenarios are alternatives for the same future credits, not consecutive semesters. Only graded credits count; repeated courses and exclusions follow your institution’s policy.'],
  };
}
