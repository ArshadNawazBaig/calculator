import {WorkspacePage} from '@/components/workspace/workspace';
import {catalog} from '@/lib/calculators/registry';
import {calculatorCardData} from '@/lib/calculator-cards';
import {pageMetadata} from '@/lib/metadata';

export const metadata = pageMetadata('My workspace', 'Your favorite tools, saved calculations, and scenarios in one place.', '/workspace', false);
export default function Page() {return <WorkspacePage tools={catalog.map(calculatorCardData)}/>;}
