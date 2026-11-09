import {PostEditor} from '@/components/admin/post-editor';
import {requireAdminPageSession} from '@/lib/server/admin-page';
export default async function NewPostPage() {await requireAdminPageSession(); return <PostEditor/>;}
