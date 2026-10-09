import {SystemPage} from '@/components/content/system-page';
import {pageMetadata} from '@/lib/metadata';
export const metadata=pageMetadata('Scheduled maintenance','Finflo is temporarily unavailable while we make an update.','/maintenance',false);
export default function Page(){return <SystemPage code="503" title="A short pause for an update." description="Finflo is temporarily undergoing maintenance. Please try again in a few minutes. Calculators already loaded in your browser may continue working."/>;}
