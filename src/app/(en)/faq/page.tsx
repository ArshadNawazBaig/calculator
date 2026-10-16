import {FaqPage} from '@/components/content/faq-page';
import {getFaqContent} from '@/lib/faq';
import {pageMetadata} from '@/lib/metadata';

export async function generateMetadata() {
  const copy = await getFaqContent('en');
  return pageMetadata(copy.seoTitle, copy.description, '/faq');
}

export default function Page() {
  return <FaqPage/>;
}
