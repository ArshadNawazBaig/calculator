import {connection} from 'next/server';
import {notFound} from 'next/navigation';
import {BlogArticle} from '@/components/blog/blog-article';
import {blogPostMetadata} from '@/components/blog/blog-meta';
import {publishedPost} from '@/components/blog/public-data';

type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props) {
  await connection();
  const post=await publishedPost((await params).slug);
  if (!post) notFound();
  return blogPostMetadata(post);
}
export default async function Page({params}:Props) {
  await connection();
  const post=await publishedPost((await params).slug);
  if (!post) notFound();
  return <BlogArticle post={post}/>;
}
