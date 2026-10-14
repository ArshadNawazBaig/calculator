import {TimePage} from '@/components/time/time-page';
import {pageMetadata} from '@/lib/metadata';
export const metadata = pageMetadata('World Clock – Current Time & Local Dates | Finflo', 'See the time now, compare cities, and keep your favorite clocks together.', '/time');
export default function Page() {return <TimePage/>;}
