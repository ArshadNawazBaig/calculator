import {TimePage} from '@/components/time/time-page';
import {prerenderTimePaths, timeRoute} from '@/lib/time/catalog';
import {pageMetadata} from '@/lib/metadata';
export const revalidate = 86400;
export function generateStaticParams() {return [...prerenderTimePaths].filter(path => path !== '/time').map(path => ({slug: path.slice('/time/'.length)}));}
export async function generateMetadata({params}: {params: Promise<{slug: string}>}) {
  const path = `/time/${(await params).slug}`, route = timeRoute(path);
  if (!route) return {title: 'Page not found | Finflo', robots: {index: false, follow: true}};
  const place = 'zone' in route ? route.zone?.place || '' : '';
  return pageMetadata(`${route.title.replace('{place}', place)} | Finflo`, route.description.replace('{place}', place), path);
}
export default async function Page({params}: {params: Promise<{slug: string}>}) {return <TimePage path={`/time/${(await params).slug}`}/>;}
