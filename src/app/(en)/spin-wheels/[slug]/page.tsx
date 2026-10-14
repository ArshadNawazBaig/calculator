import {WheelPage} from '@/components/spin-wheels/wheel-page';
import {spinWheels, wheelMap, wheelHref} from '@/lib/spin-wheels/catalog';
import {pageMetadata} from '@/lib/metadata';
export const dynamicParams = false;
export function generateStaticParams() {return spinWheels.map(wheel => ({slug: wheel.slug}));}
export async function generateMetadata({params}: {params: Promise<{slug: string}>}) {
  const wheel = wheelMap.get((await params).slug);
  return wheel ? pageMetadata(wheel.seoTitle, wheel.description, wheelHref(wheel.slug)) : {};
}
export default async function Page({params}: {params: Promise<{slug: string}>}) {return <WheelPage slug={(await params).slug}/>;}
