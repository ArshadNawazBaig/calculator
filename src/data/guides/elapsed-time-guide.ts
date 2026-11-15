import type {InfoPage} from '../information';

export const elapsedTimeGuideCalculators: Record<string, string[]> = {
  'elapsed-time-breaks-and-decimal-hours': ['time-duration-calculator', 'hours-calculator', 'time-calculator', 'time-card-calculator', 'time-zone-calculator'],
};

export const elapsedTimeGuides: Record<string, InfoPage> = {
  'elapsed-time-breaks-and-decimal-hours': {
    title: 'How to calculate elapsed time, breaks and decimal hours',
    description: 'Total a five-shift timesheet with overnight hours and breaks, convert minutes to decimal hours, and check when dates or time zones change the answer.',
    sections: [
      {
        title: 'Start with clock readings, then calculate time duration',
        paragraphs: [
          'To total several shifts, find each time duration, subtract the breaks you intend to exclude, and add the resulting minutes. Convert the combined minutes to decimal hours at the end. Overnight hours need a next-day end time; longer intervals need actual dates. A clock change needs time-zone information as well.',
          'The five-shift example below uses 24-hour clock readings, no rounding, and no time-zone transition. Each listed break is excluded once. Whether a particular break should count toward paid work depends on the arrangement you are applying; the example only establishes the arithmetic.',
        ],
      },
      {
        title: 'Work through a five-shift timesheet',
        paragraphs: [
          'Monday runs from 08:45 to 17:15: 8 hours 30 minutes, less a 45-minute break, leaves 7 hours 45 minutes. Wednesday crosses midnight. Split it into 22:15 to midnight, or 1 hour 45 minutes, and midnight to 06:45, or 6 hours 45 minutes. That is 8 hours 30 minutes before the 30-minute break and 8 hours after it.',
          'In Time between clock times, enter a row’s start, end and Break to subtract. For Wednesday, enter 22:15, 06:45 and 30. The earlier end is interpreted as the following day. The calculator returns 08:00:00 and 8 decimal hours. Enter the other rows separately to check the table.',
        ],
        table: {
          caption: 'One week of shifts, with the overnight shift assigned to its starting date',
          headers: ['Shift starts', 'Start → end', 'Break excluded', 'Time after break', 'Decimal hours'],
          rows: [
            ['Mon 2 Nov 2026', '08:45 → 17:15', '45 min', '7 h 45 min', '7.75'],
            ['Tue 3 Nov 2026', '09:10 → 17:40', '30 min', '8 h', '8'],
            ['Wed 4 Nov 2026', '22:15 → 06:45 next day', '30 min', '8 h', '8'],
            ['Thu 5 Nov 2026', '09:00 → 18:20', '50 min', '8 h 30 min', '8.5'],
            ['Fri 6 Nov 2026', '09:00 → 16:15', '45 min', '6 h 30 min', '6.5'],
            ['Total', '42 h 05 min before breaks', '200 min', '38 h 45 min', '38.75'],
          ],
        },
        links: [{label: 'Enter a shift in the time duration calculator', href: '/time-duration-calculator#mode-duration'}],
      },
      {
        title: 'Add minutes first and check the total two ways',
        paragraphs: [
          'The five intervals contain 510 + 510 + 510 + 560 + 435 = 2,525 minutes before breaks. The breaks add to 45 + 30 + 30 + 50 + 45 = 200 minutes. Subtract to get 2,325 minutes, which is 38 hours 45 minutes, or 2,325 ÷ 60 = 38.75 hours. This independently checks the sum of the five durations after breaks.',
          'To add those durations in the Time Calculator, choose Duration expression and enter 7h 45m + 8h + 8h + 8h 30m + 6h 30m. The result is 139,500 seconds and 38.75 decimal hours. Each entry already excludes its break, so do not subtract the breaks again.',
          'For a row-by-row record, open Dated shifts & overtime in the Time Card Calculator. Add the five rows using the dates, clock readings and break minutes above. Select No rounding and No overtime to reproduce this hours-only comparison. Hourly rate does not change the hours total. The total should be 38.75; the pay fields are separate from this calculation.',
        ],
        links: [
          {label: 'Enter the duration expression', href: '/time-calculator#mode-expression'},
          {label: 'Enter the five dated shifts', href: '/time-card-calculator#mode-dated-shifts'},
        ],
      },
      {
        title: 'Why 7 hours 45 minutes is 7.75 hours, not 7.45',
        paragraphs: [
          'An hour contains 60 minutes. Decimal hours = whole hours + minutes ÷ 60 + seconds ÷ 3,600. Therefore 7 hours 45 minutes = 7 + 45/60 = 7.75 hours. The digits after a decimal point describe a fraction of an hour; they are not a minutes field.',
          'To reverse the conversion, multiply the fractional part by 60. In 7.45 hours, the fraction is 0.45; 0.45 × 60 = 27 minutes. So 7.45 hours means 7 hours 27 minutes, eighteen minutes less than 7 hours 45 minutes. A duration written 07:45 uses hours and minutes, while 7.75 uses hours alone.',
        ],
        table: {
          caption: 'Convert the minutes portion before adding it to whole hours',
          headers: ['Minutes', 'Fraction of an hour', 'Decimal hours'],
          rows: [
            ['15', '15 ÷ 60', '0.25'],
            ['20', '20 ÷ 60', '0.333333…'],
            ['30', '30 ÷ 60', '0.5'],
            ['45', '45 ÷ 60', '0.75'],
          ],
        },
        links: [{label: 'BIPM SI Brochure: minute and hour definitions', href: 'https://www.bipm.org/en/publications/si-brochure'}],
      },
      {
        title: 'Keep display rounding separate from changing the records',
        paragraphs: [
          'Three 20-minute intervals total exactly 60 minutes, or 1 hour. If each is first shortened to 0.33 hours, their sum is 0.99 hours: 59 minutes 24 seconds. Rounding each entry has lost 36 seconds. Preserve minutes or seconds while adding, then round the final decimal only if the destination requires it.',
          'Rounding clock punches changes a different part of the calculation. In the dated time card, choosing a rounding interval rounds each clock-in and clock-out independently before subtracting the break. Leave this option at No rounding when you want to reproduce the original records. Showing fewer decimal places in a result is not an instruction to alter the underlying punches.',
        ],
      },
      {
        title: 'Include only the breaks that fit a repeated schedule',
        paragraphs: [
          'Suppose you plan six 25-minute work intervals with a 5-minute break between them. Work time is 6 × 25 = 150 minutes. There are five breaks between six intervals, so elapsed time from the first start to the last finish is 150 + 5 × 5 = 175 minutes, or 2 hours 55 minutes.',
          'If you also include a final 5-minute break after the last interval, the full schedule becomes 180 minutes, or 3 hours. Define the endpoint before multiplying: counting six breaks when the schedule ends at the sixth work interval adds time that is outside the requested duration. In Duration expression, enter 2h 30m + 25m for the first schedule or 2h 30m + 30m for the second.',
        ],
        links: [{label: 'Add work intervals and breaks as durations', href: '/time-calculator#mode-expression'}],
      },
      {
        title: 'Use explicit dates for 24 hours or longer',
        paragraphs: [
          'From Monday 2 November 2026 at 09:00 to Wednesday 4 November at 10:30 is 49 hours 30 minutes under ordinary clock arithmetic. Choose Between two dates and times, enter 2026-11-02 with 09:00 and 2026-11-04 with 10:30, and check the 49.5-hour result. This mode does not have a break field; subtract any excluded duration separately.',
          'Entering only 09:00 and 10:30 cannot express those two extra days. Likewise, matching start and end clock times produce zero in Time between clock times; they do not imply a 24-hour shift. Use dated endpoints when the interval could be a full day or more. Dates resolve the number of calendar days, but this mode still treats each day as 24 hours and does not apply time-zone transitions.',
        ],
        links: [{label: 'Enter both dates and times', href: '/time-duration-calculator#mode-dated'}],
      },
      {
        title: 'Convert both endpoints to UTC across a clock change',
        paragraphs: [
          'In New York on 8 March 2026, 01:30 to 03:30 spans the spring clock change. Subtracting the local clock readings gives two hours, but only one hour actually passes. The first endpoint is 06:30 UTC; the second is 07:30 UTC. The named-zone rules determine the different offsets at those two times.',
          'In Time-zone conversion, enter date 2026-03-08, From time zone America/New_York and To time zone UTC. Convert 01:30 and 03:30 separately. Then enter the resulting UTC dates and times in Between two dates and times to obtain 1 elapsed hour. Keep the converted dates too: converting between zones can move an endpoint to another date.',
          'During a backward clock change, some local times occur twice. Use Repeated local time to select the earlier or later occurrence supported by the original record. A time skipped by a forward clock change is invalid and the converter rejects it. If the record lacks the zone or occurrence, the clock reading alone may not identify an exact instant.',
          'The clock-duration and time-card modes do not make these adjustments automatically. Use named zones for date-specific conversions; a fixed UTC offset does not supply daylight-saving rules. Clock-change policies differ by location and can change, so keep the original date, zone and offset with records that need an exact elapsed-time comparison.',
        ],
        table: {
          caption: 'New York spring transition: different clock readings, one elapsed hour',
          headers: ['Endpoint', 'Local date and time', 'UTC offset', 'UTC date and time'],
          rows: [
            ['Start', '8 Mar 2026, 01:30', '−05:00', '8 Mar 2026, 06:30'],
            ['End', '8 Mar 2026, 03:30', '−04:00', '8 Mar 2026, 07:30'],
          ],
        },
        links: [
          {label: 'Convert each endpoint to UTC', href: '/time-zone-calculator#mode-zone'},
          {label: 'NIST: daylight-saving clock changes', href: 'https://www.nist.gov/pml/time-and-frequency-division/popular-links/daylight-saving-time-dst'},
          {label: 'IANA: time-zone rule updates', href: 'https://www.iana.org/time-zones'},
        ],
      },
    ],
  },
};
