import {describe, expect, it} from 'vitest';
import {calendarFacts, durationText, nextClockChange, offsetLabel, offsetMinutes, supportsZone, timerDuration} from '@/lib/time/engine';
import {zones, zoneById, timePaths, timeRoute} from '@/lib/time/catalog';
import {searchCalculators} from '@/lib/calculator-search';

describe('world clocks and time-zone data', () => {
  it('exposes unique routes and resolves every bundled name and alias', () => {
    expect(zones.length).toBeGreaterThan(400);
    expect(new Set(timePaths).size).toBe(timePaths.length);
    for (const zone of zones) {
      expect(supportsZone(zone.id), zone.id).toBe(true);
      for (const id of [zone.id, ...zone.aliases]) expect(zoneById.get(id)?.id).toBe(zone.id);
    }
    for (const path of timePaths) expect(timeRoute(path), path).toBeTruthy();
    expect(timeRoute('/time/not-a-zone')).toBeNull();
    expect(searchCalculators('stopwatch')[0].href).toBe('/time/stopwatch');
    expect(searchCalculators('world clock', 'time')[0].href).toBe('/time');
  });
  it('handles fractional offsets, negative offsets, DST and reversed Etc/GMT signs', () => {
    const winter = Date.parse('2026-01-15T12:00:00Z'), summer = Date.parse('2026-07-15T12:00:00Z');
    expect(offsetMinutes(winter, 'Asia/Kathmandu')).toBe(345);
    expect(offsetMinutes(winter, 'Asia/Kolkata')).toBe(330);
    expect(offsetMinutes(winter, 'America/New_York')).toBe(-300);
    expect(offsetMinutes(summer, 'America/New_York')).toBe(-240);
    expect(offsetMinutes(winter, 'Etc/GMT+5')).toBe(-300);
    expect(offsetMinutes(winter, 'UTC')).toBe(0);
    expect(offsetLabel(345)).toBe('UTC+05:45');
    expect(offsetLabel(-210)).toBe('UTC−03:30');
  });
  it('uses the local calendar date and ISO week across year and leap-day boundaries', () => {
    const instant = Date.parse('2026-01-01T00:30:00Z');
    expect(calendarFacts(instant, 'America/Los_Angeles')).toMatchObject({year: 2025, dayOfYear: 365, daysRemaining: 0, week: 1});
    expect(calendarFacts(instant, 'Asia/Tokyo')).toMatchObject({year: 2026, dayOfYear: 1, daysRemaining: 364, week: 1});
    expect(calendarFacts(Date.parse('2024-02-29T12:00:00Z'), 'UTC')).toMatchObject({dayOfYear: 60, daysRemaining: 306, week: 9});
    expect(calendarFacts(Date.parse('2021-01-01T12:00:00Z'), 'UTC').week).toBe(53);
  });
  it('locates the next offset change exactly and supports a half-hour transition', () => {
    expect(nextClockChange(Date.parse('2026-01-15T12:34:56Z'), 'America/New_York')).toEqual({at: Date.parse('2026-03-08T07:00:00Z'), before: -300, after: -240});
    const lordHowe = nextClockChange(Date.parse('2026-01-15T12:00:00Z'), 'Australia/Lord_Howe')!;
    expect(lordHowe.after - lordHowe.before).toBe(-30);
    expect(nextClockChange(Date.parse('2026-01-15T12:00:00Z'), 'Asia/Karachi')).toBeNull();
  });
});
describe('timer duration boundaries', () => {
  it('rejects invalid durations and keeps the countdown from becoming negative', () => {
    expect(timerDuration('99', '59', '59')).toBe(359999000);
    expect(timerDuration('', '', '1')).toBe(1000);
    for (const values of [['0','0','0'], ['0','60','0'], ['0','0','60'], ['-1','0','0'], ['100','0','0'], ['0','1.5','0'], ['0','NaN','0']]) expect(timerDuration(...values as [string,string,string])).toBeNull();
    expect(durationText(1001)).toBe('00:00:02');
    expect(durationText(-1)).toBe('00:00:00');
    expect(durationText(3661234, true)).toBe('01:01:01.23');
  });
});
