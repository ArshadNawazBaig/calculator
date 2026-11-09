import {notFound} from 'next/navigation';
import {getAdminPost} from '@/lib/server/blog';
import {requireAdminPageSession} from '@/lib/server/admin-page';
import {PostEditor} from '@/components/admin/post-editor';
export default async function EditPostPage({params}: {params: Promise<{id: string}>}) {
  await requireAdminPageSession();
  const {id} = await params;
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) notFound();
  const post = await getAdminPost(id);
  if (!post) notFound();
  return <PostEditor key={post.id} initialPost={post}/>;
}
