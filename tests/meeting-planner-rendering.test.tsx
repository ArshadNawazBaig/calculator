import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {MeetingPlanner} from '@/components/time/meeting-planner';
import {LanguageProvider} from '@/components/i18n/provider';
import {ClockComparison} from '@/components/time/clock-comparison';
import {compareMeeting, type MeetingComparison} from '@/lib/time/meeting';

const comparison = (time: string, source = 'Asia/Karachi', destination = 'Asia/Tokyo') => {
  const result = compareMeeting('2026-11-09', time, source, destination);
  if (result.repeated) throw Error('The test fixture must be unambiguous.');
  return result;
};
const render = (initial: MeetingComparison) => renderToStaticMarkup(<MeetingPlanner source={initial.source} date="2026-11-09" initial={initial}/>);
const resultTable = (html: string) => html.match(/<table[^>]*data-meeting-result[\s\S]*?<\/table>/)![0];

describe('meeting planner display and hydration', () => {
  it('renders serialized dates even when the browser formatter returns different text', () => {
    const initial = comparison('23:30');
    const descriptor = Object.getOwnPropertyDescriptor(Intl.DateTimeFormat.prototype, 'format')!;
    Object.defineProperty(Intl.DateTimeFormat.prototype, 'format', {...descriptor, get() {
      const format = descriptor.get!.call(this);
      return (date?: number | Date) => `browser:${format(date)}`;
    }});
    try {
      const html = resultTable(render(initial));
      expect(html).toContain(initial.sourceTime);
      expect(html).toContain(initial.destinationTime);
      expect(html).not.toContain('browser:');
    } finally {
      Object.defineProperty(Intl.DateTimeFormat.prototype, 'format', descriptor);
    }
  });

  it.each([
    ['12:00', 'Asia/Karachi', 'Asia/Tokyo', '4 hours ahead of the source, on the same calendar date.'],
    ['23:30', 'Asia/Karachi', 'Asia/Tokyo', '4 hours ahead of the source, one calendar day later.'],
    ['00:30', 'Asia/Karachi', 'America/New_York', '10 hours behind the source, one calendar day earlier.'],
    ['00:30', 'Pacific/Kiritimati', 'Etc/GMT+12', '26 hours behind the source, 2 calendar days earlier.'],
  ])('uses grammatical day-change wording for %s in %s compared with %s', (time, source, destination, expected) => {
    expect(render(comparison(time, source, destination))).toContain(expected);
  });

  it('serializes the requested locale in both initial and newly calculated comparisons', () => {
    const date = '2026-11-09', epoch = Date.parse(`${date}T07:00:00Z`);
    const updated = compareMeeting(date, '12:00', 'Asia/Karachi', 'America/New_York', undefined, 'fr-FR');
    if (updated.repeated) throw Error('The test fixture must be unambiguous.');
    expect(updated.sourceTime).toContain('nov.');
    expect(updated.sourceTime).not.toContain('Nov');
    const html = renderToStaticMarkup(<LanguageProvider locale="fr" messages={{}}><ClockComparison zoneId="Asia/Karachi" at={epoch} locale="fr"/></LanguageProvider>);
    expect(resultTable(html)).toContain(updated.sourceTime);
    expect(resultTable(html)).toContain(updated.destinationTime);
  });
});
