import {offsetMinutes, supportsZone, timeFormatter} from './engine';

export function localDateTime(epoch: number, zone: string): string {
  const parts = timeFormatter('en-US', zone, {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'}).formatToParts(epoch);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year.padStart(4,'0')}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
}

/** Return every real instant matching a local wall time; a spring gap has none. */
export function wallTimeInstants(date: string, time: string, zone: string): number[] {
  if (!supportsZone(zone)) throw Error('This browser does not recognize this time zone. Update your browser to continue.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}(?::\d{2})?$/.test(time)) throw Error('Enter a valid date and time.');
  const [hour, minute, second = '00'] = time.split(':');
  const target = `${date}T${hour.padStart(2,'0')}:${minute}:${second}`;
  const wall = Date.parse(target + 'Z');
  if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0,19) !== target) throw Error('Enter a valid date and time.');
  const offsets = new Set<number>();
  // Include offsets on either side of a transition, including date-line changes.
  for (let hours = -48; hours <= 48; hours += 6) offsets.add(offsetMinutes(wall + hours * 3600000, zone));
  return [...offsets].map(offset => wall - offset * 60000).filter(epoch => localDateTime(epoch, zone) === target).sort((a,b) => a-b);
}

export function resolveWallTime(date: string, time: string, zone: string, later = false): number {
  const matches = wallTimeInstants(date, time, zone);
  if (!matches.length) throw Error('This local time does not exist because clocks move forward. Choose a different time.');
  return matches[later ? matches.length - 1 : 0];
}
