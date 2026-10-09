import {NextRequest, NextResponse} from 'next/server';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === '/401K-calculator') {
    const target = request.nextUrl.clone();
    target.pathname = '/401k-calculator';
    return NextResponse.redirect(target, 308);
  }
  if (process.env.MAINTENANCE_MODE === 'true' && !path.startsWith('/_next/') && !path.includes('.') && path !== '/api/health') {
    const options = {status: 503, headers: {'Retry-After': '300', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex'}};
    return path === '/maintenance' ? NextResponse.next(options) : NextResponse.rewrite(new URL('/maintenance', request.url), options);
  }

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const canonicalHost = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://finflo.org').hostname;
  const requestHost = (request.headers.get('host') || request.nextUrl.host).split(':')[0].toLowerCase();
  // The production build can also be served on temporary hosting addresses.
  // Only the canonical domain is eligible for search indexing.
  if (process.env.NEXT_PUBLIC_INDEXABLE !== 'true' || requestHost !== canonicalHost) {
    response.headers.set('X-Robots-Tag', 'noindex, follow');
  }
  return response;
}

export const config = {matcher: ['/((?!_next/static|_next/image|favicon.ico|favicon.svg).*)']};
