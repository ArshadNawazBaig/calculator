import type {Metric} from './calculators/types';

/** Compare like-for-like numeric measures. A percent result changes in percentage points. */
export function compareMetrics(baseline: Metric[], current: Metric[]) {
  return current.flatMap(metric => {
    const previous = baseline.find(item => item.label === metric.label && item.unit === metric.unit && item.format === metric.format);
    if (!previous || typeof previous.value !== 'number' || typeof metric.value !== 'number' || metric.numericText || previous.numericText || metric.displayValue || previous.displayValue) return [];
    const difference = metric.value - previous.value;
    return Number.isFinite(difference) ? [{previous, current: metric, difference}] : [];
  });
}
