export const timeCategory = {id: 'time' as const, name: 'Time & clocks', label: 'Time & clocks', description: 'Live world clocks, local dates, and a little more time for what matters.', icon: 'time', href: '/time', links: [{name: 'World Clock', slug: 'world-clock'}, {name: 'Online Timer', slug: 'online-timer'}]};
export const timeTools = [
  {slug: 'world-clock', title: 'World Clock', href: '/time', description: 'See the time now, compare cities, and keep your favorite clocks together.', searchTerms: ['current time', 'time now', 'local time', 'world time', 'date today', 'clock']},
  {slug: 'time-zone-directory', title: 'All Time Zones', href: '/time/time-zones', description: 'Find a time zone by city, country, region, or IANA name.', searchTerms: ['timezone', 'time zones', 'utc', 'gmt', 'dst', 'daylight saving', 'city time']},
  {slug: 'online-timer', title: 'Online Timer', href: '/time/timer', description: 'Set a countdown for focus, cooking, study, or your next break.', searchTerms: ['countdown', 'timer', 'pomodoro', 'alarm', 'minutes', 'seconds']},
  {slug: 'online-stopwatch', title: 'Online Stopwatch', href: '/time/stopwatch', description: 'Measure elapsed time and record laps with a simple online stopwatch.', searchTerms: ['stopwatch', 'lap timer', 'elapsed time', 'stop watch']},
];
