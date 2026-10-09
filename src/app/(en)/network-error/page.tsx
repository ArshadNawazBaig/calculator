import {SystemPage} from '@/components/content/system-page';
import {RetryButton} from '@/components/content/retry-button';
import {pageMetadata} from '@/lib/metadata';
export const metadata=pageMetadata('Connection problem','Retry a page when the network is unavailable.','/network-error',false);
export default function Page(){return <SystemPage code="↻" title="Let’s try that connection again." description="Check your internet connection, then retry. A calculator already loaded with its calculation engine can keep working locally."><RetryButton/></SystemPage>;}
