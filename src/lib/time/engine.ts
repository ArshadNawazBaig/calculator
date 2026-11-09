import {verifiedOffset, verifiedRuleEnd} from './rule-overrides';

type ClockFormatter = Pick<Intl.DateTimeFormat, 'format' | 'formatToParts'>;
const formatters = new Map<string, ClockFormatter>();
export function timeFormatter(locale: string, zone: string, options: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify([locale, zone, options]);
  let formatter = formatters.get(key);
  if (!formatter) {
    const native = new Intl.DateTimeFormat(locale, {calendar: 'gregory', timeZone: zone, ...options});
    const utc = new Intl.DateTimeFormat(locale, {calendar: 'gregory', ...options, timeZone: 'UTC'});
    const parts = (value?: number | Date) => {
      const epoch = value === undefined ? Date.now() : Number(value), offset = verifiedOffset(epoch, zone);
      if (offset === null) return native.formatToParts(epoch);
      // UTC formatting of a shifted instant retains localized dates and clock fields.
      // Use an explicit offset instead of an outdated runtime's regional/DST name.
      return utc.formatToParts(epoch + offset * 60000).map(part => part.type === 'timeZoneName' ? {...part, value: offsetLabel(offset)} : part);
    };
    formatter = {format: value => {
      const epoch = value === undefined ? Date.now() : Number(value);
      return verifiedOffset(epoch, zone) === null ? native.format(epoch) : parts(epoch).map(part => part.value).join('');
    }, formatToParts: parts};
    if (formatters.size > 2000) formatters.clear();
    formatters.set(key, formatter);
  }
  return formatter;
}
export function supportsZone(zone: string) {
  try {timeFormatter('en', zone, {}); return true;} catch {return false;}
}
export function offsetMinutes(epoch: number, zone: string): number {
  const verified = verifiedOffset(epoch, zone);
  if (verified !== null) return verified;
  const parts = timeFormatter('en-US', zone, {timeZoneName: 'longOffset'}).formatToParts(epoch);
  const offset = parts.find(part => part.type === 'timeZoneName')!.value;
  const match = offset.match(/GMT([+-])(\d{2}):(\d{2})(?::(\d{2}))?/);
  return match ? (Number(match[2]) * 60 + Number(match[3]) + Number(match[4] || 0) / 60) * (match[1] === '-' ? -1 : 1) : 0;
}
export function offsetLabel(minutes: number) {
  const absolute = Math.abs(minutes);
  return `UTC${minutes < 0 ? '−' : '+'}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(Math.floor(absolute % 60)).padStart(2, '0')}`;
}
/** Calendar arithmetic uses the chosen zone's date, never the viewer's date. */
export function calendarFacts(epoch: number, zone: string) {
  const parts = timeFormatter('en-US', zone, {year: 'numeric', month: 'numeric', day: 'numeric'}).formatToParts(epoch);
  const value = (type: string) => Number(parts.find(part => part.type === type)!.value);
  const year = value('year'), day = Date.UTC(year, value('month') - 1, value('day'));
  const dayOfYear = Math.floor((day - Date.UTC(year, 0, 1)) / 86400000) + 1;
  const thursday = new Date(day);
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  const week = Math.ceil((((thursday.getTime() - Date.UTC(thursday.getUTCFullYear(), 0, 1)) / 86400000) + 1) / 7);
  const daysInYear = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
  return {year, dayOfYear, week, daysRemaining: daysInYear - dayOfYear, yearProgress: dayOfYear / daysInYear * 100};
}
/** Scan future offsets, then locate the change to the minute (including half-hour changes). */
export function nextClockChange(epoch: number, zone: string) {
  const before = offsetMinutes(epoch, zone);
  const start = Math.floor(epoch / 60000) * 60000;
  const ruleEnd = verifiedRuleEnd(epoch, zone);
  let low = start;
  for (let day = 1; day <= 370; day++) {
    let high = start + day * 86400000;
    // A bounded correction ending is not a political clock change.
    if (ruleEnd !== null && high >= ruleEnd) return null;
    if (offsetMinutes(high, zone) !== before) {
      while (high - low > 60000) {
        const middle = Math.floor((low + high) / 120000) * 60000;
        if (offsetMinutes(middle, zone) === before) low = middle; else high = middle;
      }
      const at = Math.ceil(high / 60000) * 60000;
      return {at, before, after: offsetMinutes(at, zone)};
    }
    low = high;
  }
  return null;
}
export function timerDuration(hours: string, minutes: string, seconds: string): number | null {
  const values = [hours, minutes, seconds].map(value => value.trim() === '' ? 0 : Number(value));
  if (values.some(value => !Number.isInteger(value) || value < 0) || values[0] > 99 || values[1] > 59 || values[2] > 59) return null;
  const duration = (values[0] * 3600 + values[1] * 60 + values[2]) * 1000;
  return duration > 0 ? duration : null;
}
export function durationText(milliseconds: number, hundredths = false) {
  const ms = Math.max(0, milliseconds), seconds = hundredths ? Math.floor(ms / 1000) : Math.ceil(ms / 1000);
  const value = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, '0')).join(':');
  return hundredths ? `${value}.${String(Math.floor(ms / 10) % 100).padStart(2, '0')}` : value;
}
