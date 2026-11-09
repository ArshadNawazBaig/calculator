'use client';
import {Button} from '@/components/ui/button';
import Link from '@/components/document-link';
import {SystemPage} from '@/components/content/system-page';

export default function BlogError({retry}: {retry:()=>void}) {
  return <SystemPage code="Try again" title="The articles couldn’t load." description="Please try again shortly. You can also explore the calculation guides and tools."><Button onClick={retry}>Try again</Button><Link className="button button-secondary" href="/guides">Explore guides</Link></SystemPage>;
}
