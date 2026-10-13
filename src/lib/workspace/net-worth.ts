import type {SavedCalculation} from './model';

/** A corrected snapshot on the same date replaces the earlier point in the trend. */
export function netWorthHistory(calculations: SavedCalculation[], currency: string) {
  const byDate = new Map<string, {id: string; name: string; date: string; createdAt: string; value: number}>();
  for (const saved of calculations) {
    if (saved.slug !== 'net-worth-tracker' || saved.algorithm !== 'toolkit-networth' || saved.currency !== currency) continue;
    const date = saved.values.snapshotDate, value = saved.metrics.find(metric => metric.label === 'Net worth')?.value;
    if (typeof value !== 'number' || !Number.isFinite(value) || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !Number.isFinite(Date.parse(date))) continue;
    const old = byDate.get(date);
    if (!old || Date.parse(saved.createdAt) > Date.parse(old.createdAt)) byDate.set(date, {id: saved.id, name: saved.name, date, createdAt: saved.createdAt, value});
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
