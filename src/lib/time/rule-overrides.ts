import data from '@/data/time-zone-rule-overrides.json';

export const clockRuleVersion = data.version;
export const clockRuleRange = '2026–2035';
const records = new Map(Object.entries(data.zones).flatMap(([id, rule]) => [id, ...rule.aliases].map(name => [name, rule] as const)));

/** Corrections for recently changed regions, shared by server and browser. */
export function verifiedOffset(epoch: number, zone: string): number | null {
  const rule = records.get(zone), seconds = epoch / 1000;
  if (!rule || seconds < data.from || seconds >= data.until) return null;
  let offset = rule.intervals[0][1];
  for (const [at, value] of rule.intervals) {
    if (at > seconds) break;
    offset = value;
  }
  return offset;
}

export function verifiedRuleEnd(epoch: number, zone: string): number | null {
  return records.has(zone) && epoch >= data.from * 1000 && epoch < data.until * 1000 ? data.until * 1000 : null;
}
