import {timeTools} from './tools';
export {timeTools} from './tools';
import data from '@/data/clock-zones.json';
export const clockZoneVersion = data.version;
export const zones = data.zones.map(zone => ({...zone,
  slug: zone.id.toLowerCase().replace(/\+/g, '-plus-').replace(/[\/_]/g, '-'),
  place: zone.id === 'UTC' ? 'UTC' : zone.id.startsWith('Etc/') ? zone.id : zone.id.split('/').at(-1)!.replace(/_/g, ' '),
  region: zone.id.includes('/') ? zone.id.split('/')[0] : 'UTC',
}));
export type ClockZone = typeof zones[number];
export const zoneBySlug = new Map(zones.map(zone => [zone.slug, zone]));
export const zoneById = new Map(zones.flatMap(zone => [zone.id, ...zone.aliases].map(id => [id, zone] as const)));
export const zoneHref = (zone: ClockZone) => `/time/${zone.slug}`;
export const popularZoneIds = ['America/New_York', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'America/Los_Angeles', 'UTC'];
export const timePaths = [...timeTools.map(tool => tool.href), ...zones.map(zoneHref)];
export const prerenderTimePaths = new Set([...timeTools.map(tool => tool.href), ...popularZoneIds.map(id => zoneById.get(id)).filter((zone): zone is ClockZone => Boolean(zone)).map(zoneHref)]);
export function timeRoute(path: string) {
  const tool = timeTools.find(tool => tool.href === path);
  if (tool) return {title: tool.title, description: tool.description};
  const zone = zoneBySlug.get(path.replace(/^\/time\//, ''));
  return zone && path === zoneHref(zone) ? {title: 'Current time in {place}', description: 'See the current time and date in {place}, with its UTC offset, upcoming clock changes, and world clock comparison.', zone} : null;
}
