import {connection} from 'next/server';
import {notFound} from 'next/navigation';
import {PageHero} from '@/components/content/page-hero';
import {BlogIndex} from '@/components/blog/blog-index';
import {blogCategories,type PublicBlogCategory} from '@/components/blog/blog-meta';
import {publishedPosts} from '@/components/blog/public-data';
import {pageMetadata} from '@/lib/metadata';

type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
function selection(params:Record<string,string|string[]|undefined>) {
  const category=typeof params.category==='string'&&blogCategories.includes(params.category as PublicBlogCategory)?params.category as PublicBlogCategory:undefined;
  const page=typeof params.page==='string'&&/^[1-9]\d{0,5}$/.test(params.page)&&Number(params.page)<=100000?Number(params.page):1;
  return {page,category,filtered:Object.keys(params).length>0};
}

export async function generateMetadata({searchParams}:Props) {
  await connection();
  const {page,category,filtered}=selection(await searchParams), result=await publishedPosts(page,category);
  return pageMetadata('Finflo blog: ideas behind the numbers','Practical articles about finance, health, math and everyday calculations, with clear assumptions and useful examples.','/blog',result.total>0&&!filtered);
}

export default async function Page({searchParams}:Props) {
  await connection();
  const {page,category}=selection(await searchParams), result=await publishedPosts(page,category);
  if (page>1&&!result.posts.length) notFound();
  return <><PageHero eyebrow="IDEAS YOU CAN USE" title="Look beyond the number." description="Practical articles and worked guides for making sense of everyday calculations." breadcrumbs={[{label:'Blog'}]}/><BlogIndex {...result} page={page} category={category}/></>;
}
