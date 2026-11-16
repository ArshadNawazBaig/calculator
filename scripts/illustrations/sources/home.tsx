import {Calculator, CalendarDays, Clock3, Disc3, HeartPulse} from 'lucide-react';

/** Maintained source artwork for the homepage's static spotlight backgrounds. */
export const homeIllustrations = [
  {id: 'finance', width: 260, height: 130},
  {id: 'health', width: 125, height: 125},
  {id: 'math', width: 125, height: 125},
  {id: 'everyday', width: 125, height: 125},
  {id: 'spin-wheels', width: 125, height: 125},
  {id: 'time', width: 125, height: 125},
] as const;

export type HomeIllustrationKind = typeof homeIllustrations[number]['id'];

const categoryDrawings = {
  health: HeartPulse,
  math: Calculator,
  everyday: CalendarDays,
  'spin-wheels': Disc3,
  time: Clock3,
};

/** Explicit colors let the raster exporter reproduce screen and print palettes. */
export function HomeIllustrationSource({kind, color}: {kind: HomeIllustrationKind; color: string}) {
  if (kind !== 'finance') {
    const Drawing = categoryDrawings[kind];
    return <Drawing width={125} height={125} color={color} strokeWidth={1}/>;
  }
  return <svg xmlns="http://www.w3.org/2000/svg" width="260" height="130" viewBox="0 0 260 130" fill="none">
    <defs><linearGradient id="home-growth-fill" x1="130" y1="15" x2="130" y2="125" gradientUnits="userSpaceOnUse"><stop stopColor={color} stopOpacity=".5"/><stop offset="1" stopColor={color} stopOpacity=".02"/></linearGradient></defs>
    <path d="M12 117C53 110 65 102 88 93S128 73 150 62S194 40 218 23L248 6V118H12Z" fill="url(#home-growth-fill)"/>
    <path d="M12 117C53 110 65 102 88 93S128 73 150 62S194 40 218 23L248 6" stroke={color} strokeWidth="2"/>
    <path d="M12 118H249" stroke={color} strokeOpacity=".3"/>
    {[[72,100],[132,71],[190,40],[248,6]].map(([cx,cy]) => <circle key={cx} cx={cx} cy={cy} r="4" fill={color}/>)}
  </svg>;
}
