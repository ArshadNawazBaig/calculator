import {describe, expect, it} from 'vitest';
import {calendarFacts, nextClockChange, offsetMinutes, timeFormatter} from '@/lib/time/engine';
import {localDateTime, resolveWallTime, wallTimeInstants} from '@/lib/time/wall-time';
import {run} from '@/lib/calculators/everyday-engine';
import {compareMeeting} from '@/lib/time/meeting';

// Expectations transcribed from official IANA 2026f transition rules, rather
// than obtained from Intl (the local runtime still contains tz2025c).
describe('IANA 2026f corrections shared by clocks and conversions', () => {
  it.each([
    ['Africa/Casablanca', 0], ['Africa/El_Aaiun', 0], ['America/Edmonton', -360],
    ['America/Inuvik', -360], ['America/Vancouver', -420], ['America/Winnipeg', -300],
    ['America/Havana', -240], ['Canada/Pacific', -420], ['Canada/Central', -300], ['Cuba', -240],
  ])('uses the published November 2026 offset for %s', (zone, expected) => {
    expect(offsetMinutes(Date.parse('2026-11-09T12:00:00Z'), String(zone))).toBe(expected);
  });

  it('formats corrected full dates, explicit zone labels, and calendar boundaries', () => {
    const at = Date.parse('2026-11-09T04:30:00Z');
    expect(localDateTime(at, 'America/Havana')).toBe('2026-11-09T00:30:00');
    expect(calendarFacts(at, 'America/Havana').dayOfYear).toBe(313);
    expect(timeFormatter('en-US','America/Havana',{hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'long'}).format(at)).toContain('UTC−04:00');
    expect(nextClockChange(Date.parse('2026-11-09T12:00:00Z'),'America/Havana')).toEqual({at:Date.parse('2027-11-07T05:00:00Z'),before:-240,after:-300});
    expect(nextClockChange(at,'America/Winnipeg')).toBeNull();
  });

  it('does not invent a fall-back in regions which abolished it', () => {
    expect(wallTimeInstants('2026-11-01','01:30','America/Edmonton')).toEqual([Date.parse('2026-11-01T07:30:00Z')]);
    expect(wallTimeInstants('2026-11-01','00:30','America/Havana')).toEqual([Date.parse('2026-11-01T04:30:00Z')]);
    const converted = run('time-zone',{date:'2026-11-09',time:'00:30',from:'America/Havana',to:'UTC',ambiguity:'earlier'});
    expect(converted.metrics[2].value).toBe('2026-11-09T04:30:00.000Z');
    expect(converted.metrics[3].value).toBe(-240);
    const reverse = run('time-zone',{date:'2026-11-09',time:'04:30',from:'UTC',to:'America/Havana',ambiguity:'earlier'});
    expect(reverse.metrics[0].value).toBe('2026-11-09 00:30:00');
  });

  it('resolves the actual 2027 Cuba repeated time to either occurrence', () => {
    expect(wallTimeInstants('2027-11-07','00:30','America/Havana')).toEqual([
      Date.parse('2027-11-07T04:30:00Z'), Date.parse('2027-11-07T05:30:00Z'),
    ]);
  });
});

describe('local date and time resolution', () => {
  it('compares a dated meeting with explicit day shifts and offset difference', () => {
    expect(compareMeeting('2026-11-09','23:30','Asia/Karachi','Asia/Tokyo')).toMatchObject({repeated:false,epoch:Date.parse('2026-11-09T18:30:00Z'),dayDifference:1,minuteDifference:240,sourceOffset:'UTC+05:00',destinationOffset:'UTC+09:00'});
    expect(compareMeeting('2026-11-09','00:30','Asia/Karachi','America/New_York')).toMatchObject({dayDifference:-1,minuteDifference:-600});
    expect(compareMeeting('2026-11-01','01:30','America/New_York','UTC')).toEqual({repeated:true});
    expect(compareMeeting('2026-11-01','01:30','America/New_York','UTC','later')).toMatchObject({epoch:Date.parse('2026-11-01T06:30:00Z'),occurrence:'later'});
  });
  it('rejects spring gaps and skipped civil days', () => {
    expect(wallTimeInstants('2026-03-08','02:30','America/New_York')).toEqual([]);
    expect(wallTimeInstants('2026-10-04','02:15','Australia/Lord_Howe')).toEqual([]);
    expect(wallTimeInstants('2011-12-30','12:00','Pacific/Apia')).toEqual([]);
    expect(() => resolveWallTime('2026-03-08','02:30','America/New_York')).toThrow('does not exist');
  });
  it('preserves both hour and half-hour repeated times', () => {
    expect(wallTimeInstants('2026-11-01','01:30','America/New_York')).toEqual([Date.parse('2026-11-01T05:30:00Z'), Date.parse('2026-11-01T06:30:00Z')]);
    expect(resolveWallTime('2026-11-01','01:30','America/New_York',true)).toBe(Date.parse('2026-11-01T06:30:00Z'));
    expect(wallTimeInstants('2026-04-05','01:45','Australia/Lord_Howe')).toEqual([Date.parse('2026-04-04T14:45:00Z'), Date.parse('2026-04-04T15:15:00Z')]);
  });
  it('retains fractional offsets and changes the destination calendar day', () => {
    const at = resolveWallTime('2026-01-01','0:30','Pacific/Kiritimati');
    expect(new Date(at).toISOString()).toBe('2025-12-31T10:30:00.000Z');
    expect(localDateTime(at,'Pacific/Honolulu')).toBe('2025-12-31T00:30:00');
    expect(resolveWallTime('2026-01-01','12:00','Asia/Kathmandu')).toBe(Date.parse('2026-01-01T06:15:00Z'));
  });
  it.each([['2026-02-30','12:00'],['2026-01-01','24:00'],['2026-01-01','12:60'],['bad','12:00']])('rejects invalid calendar or clock fields', (date,time) => {
    expect(() => wallTimeInstants(date,time,'UTC')).toThrow('valid date and time');
  });
  it('reports unrecognized zones without crashing the page', () => {
    expect(() => wallTimeInstants('2026-01-01','12:00','Invalid/Zone')).toThrow('does not recognize');
  });
});
