import {SystemPage} from '@/components/content/system-page';
import {RetryButton} from '@/components/content/retry-button';
import {pageMetadata} from '@/lib/metadata';
export const metadata=pageMetadata('You are offline','Information about Finflo’s offline capabilities.','/offline',false);
export default function Page(){return <SystemPage code="Offline" title="Your connection is taking a break." description="Loaded calculators can continue working when their calculation engine is available. Opening a new page or an uncached first visit requires a connection. Finflo does not claim full offline access."><RetryButton/></SystemPage>;}
