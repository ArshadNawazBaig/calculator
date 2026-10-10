import {createRoadService, RoutingError} from '@/lib/data/road-routing';

export const runtime = 'nodejs';
const service = createRoadService({geocoder: process.env.ROAD_GEOCODER_URL, router: process.env.ROAD_ROUTER_URL});
const headers = {'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex'};

export async function POST(request: Request) {
  try {
    if (process.env.ROAD_ROUTING_ENABLED === 'false') throw new RoutingError('Road routing is currently unavailable.', 503);
    const origin = request.headers.get('origin');
    const allowedOrigins = [new URL(request.url).origin];
    // A reverse proxy can give Next an internal request URL. Only the configured
    // public origin is additionally trusted, never arbitrary forwarded headers.
    if (process.env.NEXT_PUBLIC_SITE_URL) allowedOrigins.push(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin);
    if (origin && !allowedOrigins.includes(origin)) throw new RoutingError('Open this calculator on Finflo to use map services.', 403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new RoutingError('Send a JSON route request.');
    if (Number(request.headers.get('content-length')) > 4096) throw new RoutingError('The route request is too large.', 413);
    const text = await request.text();
    if (text.length > 4096) throw new RoutingError('The route request is too large.', 413);
    let input;
    try { input = JSON.parse(text); } catch { throw new RoutingError('Enter a valid route request.'); }
    if (!input || typeof input !== 'object') throw new RoutingError('Enter a valid route request.');
    if (input.kind === 'search') return Response.json({places: await service.search(input.query)}, {headers});
    if (input.kind === 'route') return Response.json(await service.route(input.from, input.to), {headers});
    throw new RoutingError('Select a supported map operation.');
  } catch (error) {
    const known = error instanceof RoutingError;
    const status = known ? error.status : 503;
    return Response.json({error: known ? error.message : 'The map service is temporarily unavailable. Try again later.'}, {status, headers: {...headers, ...(status === 429 ? {'Retry-After': '5'} : {})}});
  }
}
