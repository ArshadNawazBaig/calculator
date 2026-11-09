import 'server-only';
import {redirect} from 'next/navigation';
import {getSuperAdminSession} from './auth';

/** Pages render alongside layouts, so each page establishes its own redirect. */
export async function requireAdminPageSession() {
  const session = await getSuperAdminSession();
  if (!session) redirect('/admin/sign-in');
  return session;
}
