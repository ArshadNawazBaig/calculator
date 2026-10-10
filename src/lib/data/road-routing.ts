export type RoadPoint = {lat: number; lon: number};
export type RoadPlace = RoadPoint & {label: string};
export type RoadTrip = {meters: number; seconds: number; snapped: (RoadPoint & {distance: number})[]; retrievedAt: string};
export class RoutingError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function roadPoint(value: unknown): RoadPoint {
  if (!value || typeof value !== 'object') throw new RoutingError('Enter both route locations.');
  const {lat, lon} = value as RoadPoint;
  if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new RoutingError('Enter valid latitude and longitude coordinates.');
  return {lat, lon};
}

export function parseRoadTrip(raw: unknown): Omit<RoadTrip, 'retrievedAt'> {
  const data = raw as {code?: string; routes?: {distance?: unknown; duration?: unknown}[]; waypoints?: {location?: number[]; distance?: unknown}[]};
  if (data?.code === 'NoRoute' || data?.code === 'NoSegment') throw new RoutingError('No driving route was found near these locations. Choose locations connected by roads.', 422);
  const route = data?.routes?.[0];
  if (data?.code !== 'Ok' || typeof route?.distance !== 'number' || typeof route.duration !== 'number' || !Number.isFinite(route.distance) || !Number.isFinite(route.duration) || route.distance < 0 || route.duration < 0 || data.waypoints?.length !== 2) throw new RoutingError('The routing service returned an incomplete route. Try again later.', 503);
  const snapped = data.waypoints.map(point => {
    if (!Array.isArray(point.location) || point.location.length !== 2 || typeof point.distance !== 'number' || !Number.isFinite(point.distance) || point.distance < 0 || point.distance > 1001) throw new RoutingError('The routing service could not match a nearby road.', 503);
    return {...roadPoint({lat: point.location[1], lon: point.location[0]}), distance: point.distance};
  });
  return {meters: route.distance, seconds: route.duration, snapped};
}

// One instance per server process. Public providers require one application-wide
// request/second: use one replica, or a shared rate-limited gateway when scaling.
// Inputs are kept only in a bounded, expiring memory cache, never logged here.
export function createRoadService({fetcher = fetch, geocoder = 'https://nominatim.openstreetmap.org/search', router = 'https://routing.openstreetmap.de/routed-car', now = Date.now, pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))} = {}) {
  type Entry = {expires: number; promise: Promise<unknown>; timer?: ReturnType<typeof setTimeout>};
  const cache = new Map<string, Entry>();
  const nextStart = {search: 0, route: 0};
  async function request(kind: 'search' | 'route', url: string, ttl: number): Promise<unknown> {
    const existing = cache.get(url);
    if (existing && existing.expires > now()) return existing.promise;
    const wait = Math.max(0, nextStart[kind] - now());
    if (wait > 3300) throw new RoutingError('The map service is busy. Wait a few seconds and try again.', 429);
    nextStart[kind] = now() + wait + 1100;
    const entry: Entry = {expires: Infinity, promise: Promise.resolve()};
    entry.promise = (async () => {
      if (wait) await pause(wait);
      try {
        const response = await fetcher(url, {headers: {'User-Agent': 'Finflo/1.0 (+https://finflo.org/contact)', Accept: 'application/json'}, cache: 'no-store', signal: AbortSignal.timeout(10000)});
        if (response.status === 429) throw new RoutingError('The map service is busy. Wait a few seconds and try again.', 429);
        if (!response.ok && !(kind === 'route' && response.status === 400)) throw new RoutingError('The map service is temporarily unavailable. Try again later.', 503);
        const text = await response.text();
        if (text.length > 262144) throw new RoutingError('The map service returned too much data.', 503);
        const data: unknown = JSON.parse(text);
        entry.expires = now() + ttl;
        entry.timer = setTimeout(() => {if (cache.get(url) === entry) cache.delete(url);}, ttl);
        entry.timer.unref?.();
        return data;
      } catch (error) {
        if (cache.get(url) === entry) cache.delete(url);
        if (error instanceof RoutingError) throw error;
        throw new RoutingError('The map service is temporarily unavailable. Try again later.', 503);
      }
    })();
    // Evict settled entries only, retaining in-flight request coalescing.
    for (const [key, item] of cache) if (item.expires <= now() || cache.size >= 256 && item.expires !== Infinity) {
      if (item.timer) clearTimeout(item.timer);
      cache.delete(key);
    }
    cache.set(url, entry);
    return entry.promise;
  }
  return {
    async search(query: unknown): Promise<RoadPlace[]> {
      if (typeof query !== 'string' || query.trim().length < 3 || query.length > 200) throw new RoutingError('Enter a place name between 3 and 200 characters.');
      const url = new URL(geocoder);
      url.searchParams.set('q', query.trim()); url.searchParams.set('format', 'jsonv2'); url.searchParams.set('limit', '5'); url.searchParams.set('addressdetails', '0');
      const data = await request('search', url.href, 86400000);
      if (!Array.isArray(data)) throw new RoutingError('The place search returned an invalid response.', 503);
      return data.slice(0, 5).map(item => {
        if (typeof item?.display_name !== 'string' || item.display_name.length > 1000 || typeof item.lat !== 'string' || typeof item.lon !== 'string' || !item.lat.trim() || !item.lon.trim()) throw new RoutingError('The place search returned an invalid location.', 503);
        return {...roadPoint({lat: Number(item.lat), lon: Number(item.lon)}), label: item.display_name};
      });
    },
    async route(from: unknown, to: unknown): Promise<RoadTrip> {
      const a = roadPoint(from), b = roadPoint(to);
      const points = [a, b].map(p => `${p.lon.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
      const url = `${router.replace(/\/$/, '')}/route/v1/driving/${points}?overview=false&steps=false&alternatives=false&radiuses=1000;1000`;
      const data = await request('route', url, 300000);
      return {...parseRoadTrip(data), retrievedAt: new Date(now()).toISOString()};
    },
  };
}
