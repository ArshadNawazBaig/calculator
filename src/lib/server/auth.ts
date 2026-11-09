import 'server-only';
import {headers} from 'next/headers';
import {getDb, isDatabaseConfigured} from './db';
import {AuthError, createAuthCore, readAdminConfiguration, type SuperAdminSession} from './auth-core';

export {AuthError, type SuperAdminSession} from './auth-core';

export function isAdminConfigured(): boolean {
  return isDatabaseConfigured() && Boolean(readAdminConfiguration());
}

let auth: ReturnType<typeof createAuthCore> | undefined;
export function getAuth() {
  const config = readAdminConfiguration();
  if (!isDatabaseConfigured() || !config) throw new AuthError('Admin sign-in is not configured.', 503);
  return auth ??= createAuthCore(getDb(), config);
}

async function authoritativeSession() {
  // Keep Next's request-time control flow outside the provider error boundary.
  const requestHeaders = await headers();
  try {
    return await getAuth().api.getSession({headers: requestHeaders, query: {disableCookieCache: true, disableRefresh: true}});
  } catch {
    throw new AuthError('Admin authentication is temporarily unavailable.', 503);
  }
}

function safeSession(value: NonNullable<Awaited<ReturnType<typeof authoritativeSession>>>): SuperAdminSession {
  return {user: {id: value.user.id, email: value.user.email, name: value.user.name, role: 'super_admin'}, session: {id: value.session.id, expiresAt: value.session.expiresAt}};
}

export async function getSuperAdminSession(): Promise<SuperAdminSession | null> {
  if (!isAdminConfigured()) return null;
  const current = await authoritativeSession();
  return current?.user.role === 'super_admin' ? safeSession(current) : null;
}

/** Every privileged action must call this, independently of page visibility. */
export async function requireSuperAdmin(): Promise<SuperAdminSession> {
  if (!isAdminConfigured()) throw new AuthError('Admin sign-in is not configured.', 503);
  const current = await authoritativeSession();
  if (!current) throw new AuthError('Sign in to continue.', 401);
  if (current.user.role !== 'super_admin') throw new AuthError('You do not have permission to manage the blog.', 403);
  return safeSession(current);
}
