import {SpinWheelsPage, wheelLibraryTitle, wheelLibraryDescription} from '@/components/spin-wheels/library-page';
import {pageMetadata} from '@/lib/metadata';
export const metadata = pageMetadata(wheelLibraryTitle, wheelLibraryDescription, '/spin-wheels');
export default function Page() {return <SpinWheelsPage/>;}
