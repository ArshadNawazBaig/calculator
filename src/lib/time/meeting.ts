import {localDateTime, wallTimeInstants} from './wall-time';
import {offsetMinutes, offsetLabel, timeFormatter} from './engine';

export function compareMeeting(date: string, time: string, source: string, destination: string, occurrence?: 'earlier' | 'later') {
  const matches = wallTimeInstants(date,time,source);
  if (!matches.length) throw Error('This local time does not exist because clocks move forward. Choose a different time.');
  if (matches.length > 1 && !occurrence) return {repeated:true as const};
  const epoch = matches[occurrence === 'later' ? matches.length - 1 : 0];
  const from = localDateTime(epoch,source), to = localDateTime(epoch,destination);
  const localDay = (value: string) => Date.parse(value.slice(0,10) + 'T00:00:00Z');
  const dayDifference = (localDay(to) - localDay(from)) / 86400000;
  const minuteDifference = offsetMinutes(epoch,destination) - offsetMinutes(epoch,source);
  const format = (zone: string) => timeFormatter('en-US',zone,{weekday:'short',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(epoch);
  return {repeated:false as const,epoch,source,destination,sourceTime:format(source),destinationTime:format(destination),sourceOffset:offsetLabel(offsetMinutes(epoch,source)),destinationOffset:offsetLabel(offsetMinutes(epoch,destination)),dayDifference,minuteDifference,occurrence:matches.length > 1 ? occurrence : undefined};
}

export type MeetingComparison = Exclude<ReturnType<typeof compareMeeting>, {repeated:true}>;
