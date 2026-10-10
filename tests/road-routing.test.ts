import {afterEach, describe, expect, it, vi} from 'vitest';
import {createRoadService, parseRoadTrip, roadPoint} from '@/lib/data/road-routing';
import {runRoadRoute} from '@/lib/calculators/road-route';
import {calculatorCardData} from '@/lib/calculator-cards';
import {toolMap, blocked, noInitialExampleTools} from '@/lib/calculators/registry';

const raw = {code: 'Ok', routes: [{distance: 16093.44, duration: 1200}], waypoints: [{location: [-.1278, 51.5074], distance: 5}, {location: [.1218, 52.2053], distance: 10}]};
const a = {lat: 51.5074, lon: -.1278}, b = {lat: 52.2053, lon: .1218};
afterEach(() => vi.unstubAllGlobals());
describe('Road service and result validation', () => {
  it('uses the actual route distance, duration and matched endpoints', () => {
    expect(parseRoadTrip(raw)).toEqual({meters: 16093.44, seconds: 1200, snapped: [{...a, distance: 5}, {...b, distance: 10}]});
  });
  for (const code of ['NoRoute', 'NoSegment']) it(`does not replace ${code} with a straight-line estimate`, () => expect(() => parseRoadTrip({code})).toThrow(/No driving route/));
  for (const bad of [null, {}, {lat: '', lon: ''}, {lat: NaN, lon: 0}, {lat: 91, lon: 0}, {lat: 0, lon: 181}]) it(`rejects invalid coordinates ${JSON.stringify(bad)}`, () => expect(() => roadPoint(bad)).toThrow());
  it('allows zero coordinates', () => expect(roadPoint({lat: 0, lon: 0})).toEqual({lat: 0, lon: 0}));
  for (const bad of [{...raw, routes: [{distance: -1, duration: 20}]}, {...raw, routes: [{distance: 20, duration: NaN}]}, {...raw, waypoints: []}, {...raw, waypoints: [{location: [0, 0], distance: 5000}, raw.waypoints[1]]}]) it('rejects incomplete or invalid provider data', () => expect(() => parseRoadTrip(bad)).toThrow());
  it('sends longitude first, identifies Finflo and limits road snapping', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(raw));
    await createRoadService({fetcher}).route(a, b);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toContain('/-0.127800,51.507400;0.121800,52.205300?');
    expect(url).toContain('radiuses=1000;1000');
    expect(init.headers['User-Agent']).toContain('finflo.org');
    expect(init.cache).toBe('no-store');
  });
  it('coalesces requests and caches identical routes without recontacting the provider', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(raw)), service = createRoadService({fetcher});
    await Promise.all([service.route(a, b), service.route(a, b)]);
    await service.route(a, b);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('paces distinct requests and bounds the waiting queue', async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(Response.json(raw)));
    const pause = vi.fn().mockResolvedValue(undefined), service = createRoadService({fetcher, now: () => 10000, pause});
    await service.route(a, b);
    await service.route(a, {...b, lon: .2});
    await service.route(a, {...b, lon: .3});
    await service.route(a, {...b, lon: .4});
    await expect(service.route(a, {...b, lon: .5})).rejects.toMatchObject({status: 429});
    expect(pause.mock.calls.map(call => call[0])).toEqual([1100, 2200, 3300]);
  });
  it('offers all returned place matches without selecting the first one', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json([{lat: '51.5', lon: '-.1', display_name: 'London, UK'}, {lat: '42.9', lon: '-81.2', display_name: 'London, Canada'}]));
    const places = await createRoadService({fetcher}).search('London');
    expect(places).toHaveLength(2);
    expect(places[1].label).toBe('London, Canada');
    expect(fetcher.mock.calls[0][0]).toContain('q=London');
  });
  it('does not call a provider for blank search or invalid coordinates', async () => {
    const fetcher = vi.fn(), service = createRoadService({fetcher});
    await expect(service.search(' ')).rejects.toThrow();
    await expect(service.route({lat: 100, lon: 0}, b)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('returns a useful error on provider failure', async () => {
    await expect(createRoadService({fetcher: vi.fn().mockRejectedValue(new Error('secret upstream details'))}).route(a, b)).rejects.toThrow('temporarily unavailable');
  });
  it('converts a 16093.44 meter route into ten miles', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({...parseRoadTrip(raw), retrievedAt: '2026-10-10T00:00:00Z'})));
    const r = await runRoadRoute({locationInput: 'coordinates', lat1: String(a.lat), lon1: String(a.lon), lat2: String(b.lat), lon2: String(b.lon)});
    expect(r.metrics.map(m => m.value)).toEqual([10, 16.09344, 20]);
  });
  it('requires confirmed search results before routing', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    await expect(runRoadRoute({locationInput: 'places', placeQuery1: 'London', placeQuery2: 'Cambridge'})).rejects.toThrow(/select both/);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('lists mileage as available and never requests a prerendered route example', () => {
    expect(blocked['mileage-calculator']).toBeUndefined();
    expect(calculatorCardData(toolMap.get('mileage-calculator')!).status).toBe('available');
    expect(noInitialExampleTools.has('mileage-calculator')).toBe(true);
  });
});
