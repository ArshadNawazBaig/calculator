import {getAuth, isAdminConfigured} from '@/lib/server/auth';
import {getAdminTrustedOrigins, readAdminConfiguration} from '@/lib/server/auth-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const privateHeaders = {'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow'};
const routes: Record<string, string> = {'/api/auth/sign-in/email': 'POST', '/api/auth/sign-out': 'POST', '/api/auth/get-session': 'GET'};

function json(message: string, status: number) {
  return Response.json({message}, {status, headers: privateHeaders});
}

async function boundedRequest(request: Request): Promise<Request | null> {
  if (request.method !== 'POST' || !request.body) return request;
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    length += chunk.value.byteLength;
    if (length > 8192) {await reader.cancel(); return null;}
    chunks.push(chunk.value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {body.set(chunk, offset); offset += chunk.byteLength;}
  return new Request(request.url, {method: request.method, headers: request.headers, signal: request.signal, body});
}

async function handle(request: Request) {
  const path = new URL(request.url).pathname;
  if (!routes[path] || routes[path] !== request.method) return json('Not found.', 404);
  if (!isAdminConfigured()) return json('Admin sign-in is not configured.', 503);
  const trustedOrigins = getAdminTrustedOrigins(readAdminConfiguration()!);
  if (request.method === 'POST' && !trustedOrigins.includes(request.headers.get('origin') || '')) return json('Request origin is not allowed.', 403);
  if (Number(request.headers.get('content-length')) > 8192) return json('Request is too large.', 413);
  try {
    const bounded = await boundedRequest(request);
    if (!bounded) return json('Request is too large.', 413);
    const response = await getAuth().handler(bounded);
    const resultHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(privateHeaders)) resultHeaders.set(key, value);
    if (response.status >= 500) return Response.json({message: 'Admin authentication is temporarily unavailable.'}, {status: 503, headers: resultHeaders});
    if (path === '/api/auth/sign-in/email' && !response.ok) {
      const status = response.status === 429 ? 429 : response.status >= 500 ? 503 : 401;
      if (status === 429) resultHeaders.set('Retry-After', '900');
      return Response.json({message: status === 429 ? 'Sign-in is temporarily unavailable. Try again later.' : status === 503 ? 'Admin authentication is temporarily unavailable.' : 'Email or password is incorrect.'}, {status, headers: resultHeaders});
    }
    return new Response(response.body, {status: response.status, headers: resultHeaders});
  } catch {return json('Admin authentication is temporarily unavailable.', 503);}
}

export const GET = handle;
export const POST = handle;
