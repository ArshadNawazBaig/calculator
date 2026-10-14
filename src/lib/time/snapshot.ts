import {calendarFacts, nextClockChange, offsetMinutes, supportsZone, timeFormatter} from './engine';

export const defaultClockIds = ['America/New_York', 'Europe/London', 'Asia/Tokyo'];

/** Serialize display strings too: server and browser ICU versions can format differently. */
export function createClockSnapshot(at: number, zoneId: string, locale: string) {
  if (!supportsZone(zoneId)) return null;
  const nextChange = nextClockChange(at, zoneId);
  return {
    at, zoneId,
    time: timeFormatter(locale, zoneId, {hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'}).format(at),
    date: timeFormatter(locale, zoneId, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}).format(at),
    zoneName: timeFormatter(locale, zoneId, {timeZoneName: 'long'}).formatToParts(at).find(part => part.type === 'timeZoneName')?.value || zoneId,
    offset: offsetMinutes(at, zoneId),
    facts: calendarFacts(at, zoneId),
    nextChange,
    changeDate: nextChange ? timeFormatter(locale, zoneId, {month: 'short', day: 'numeric', year: 'numeric'}).format(nextChange.at) : null,
    favorites: Object.fromEntries(defaultClockIds.filter(supportsZone).map(id => [id, {
      time: timeFormatter(locale, id, {hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(at),
      date: timeFormatter(locale, id, {weekday: 'short', month: 'short', day: 'numeric'}).format(at),
    }])),
  };
}

export type ClockSnapshot = ReturnType<typeof createClockSnapshot>;
